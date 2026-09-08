import os 

from pinecone import Pinecone
from pinecone import ServerlessSpec
from langchain_pinecone import PineconeVectorStore

from pinecone import Pinecone
from pinecone import ServerlessSpec
from langchain_pinecone import PineconeVectorStore

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from gmail_scrapper import get_curriculum

def splitter():

    # aqui a gente vai dividir o curriculo em chunks para fazer o embendding e dps armazenar no bv
    curriculos = get_curriculum()

  
    text_splitter = RecursiveCharacterTextSplitter(

        chunk_size    = 500,
        chunk_overlap = 50
    )

    split = []

    #pegando o texto ja separado do get_curriculum() e corta ele, alem disso ele manda o id como metadata
    for curriculo in curriculos:
        
        chunks = text_splitter.create_documents(
            [curriculo["curriculo"]],
        
        metadatas = [{

                "id": curriculo["id"],
                "remetente": curriculo["remetente"]

            }]
        )

        split.extend(chunks)

    
    return split 

def embendding():

    #iniciando o modelo de embendding 

    embendding = HuggingFaceEmbeddings(

        model_name    = "sentence-transformers/all-mpnet-base-v2",
        encode_kwargs = {"normalize_embeddings": True}
    )

    return embendding




def pinecone():


    #instancias basicas do pinecone
    pcapikey   = os.getenv("PINECONE_API_KEY")
    pinecone   = Pinecone(api_key = pcapikey)
    index_name = "rh-curriculo-analisador"

    split      = splitter()
    embenddings = embendding()
    
    #verifica se existe um banco vetorial com esse nome , se n tiver ele cria
    if not pinecone.has_index(index_name):

        pinecone.create_index(

            name      = index_name,
            dimension = 768,
            metric    = "cosine",
            spec      = ServerlessSpec( cloud = "aws", region = "us-east-1")
        )

    index = pinecone.Index(index_name)



    # colocanddo dentro do pinecone 
    vector_store = PineconeVectorStore( index = index, embedding = embenddings)
    vector_store.add_documents(split)

    return vector_store

def llm():

    
    vector_store = pinecone()

    #busca dentro do pinecone 
    retriever = vector_store.as_retriever(
        search_kwargs={"k": 4}
    )

    #modelo
    model = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash"
    )

    documentos = retriever.invoke("experiência profissional, CNH, entregas")

    #olha as paginas do arquivo no pinecone
    contexto = "\n\n".join(
        doc.page_content for doc in documentos
    )

    prompt = f"""
    Analise o currículo abaixo para a vaga de Assistente da Administração
    da MOTOMAR - Honda.

    VAGA:
    - CNH A/B é requisito obrigatório.
    - Experiência com entrega é um diferencial.
    - Entrega de motos entre unidades.
    - Seguir rotas e cronogramas.
    - Carregar e descarregar veículos.

    CURRÍCULO:
    {contexto}

    Informe:
    - Nome

    - Experiências relevantes
    - Pontos positivos
    - Pontos de atenção
    - Compatibilidade de 0 a 100
    - Classificação final
    """

    resposta = model.invoke(prompt)
    print(resposta.content)
    return resposta.content

llm()