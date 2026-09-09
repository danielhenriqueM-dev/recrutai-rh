import os 
from dotenv import load_dotenv

from pinecone import Pinecone
from pinecone import ServerlessSpec
from langchain_pinecone import PineconeVectorStore

from pinecone import Pinecone
from pinecone import ServerlessSpec
from langchain_pinecone import PineconeVectorStore

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

import firebase_admin
from firebase_admin import credentials, firestore

load_dotenv()

def fb():

    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

    credential = credentials.Certificate(credentials_path)

    if not firebase_admin._apps:
        firebase_admin.initialize_app(credential)


    db = firestore.client()

    doc_ref = db.collection("curriculos")
    query   = doc_ref.limit(10)

    docs = query.get()

    curriculo = []

    if docs:
        for doc in docs:
            curriculo.append({

                "id": doc.id,
                "conteudo": doc.to_dict()

            })

    print("CURRICULO ENVIADO DO FB")
    print(curriculo)
    return curriculo

           
    



def splitter():

    print("CURRICULO INDO PARA O SPLITTER")
    # aqui a gente vai dividir o curriculo em chunks para fazer o embendding e dps armazenar no bv
    curriculos = fb()


    text_splitter = RecursiveCharacterTextSplitter(

        chunk_size    = 500,
        chunk_overlap = 50
    )

    split = []

    #pegando o texto ja separado do get_curriculum() e corta ele, alem disso ele manda o id como metadata
    for curriculo in curriculos:

        data = curriculo["conteudo"]

        chunks = text_splitter.create_documents(

            [data["curriculo"]],
        
        metadatas = [{

                "id": curriculo["id"],
                "remetente": data["remetente"]

            }]
        )

        split.extend(chunks)

    print("CURRICULO INDO PARA O EMBENDDING")
    print(split)
    return split 

def embendding():

    #iniciando o modelo de embendding 

    embendding = HuggingFaceEmbeddings(

        model_name    = "sentence-transformers/all-mpnet-base-v2",
        encode_kwargs = {"normalize_embeddings": True}
    )

    return embendding




def pinecone(split):

    

    #instancias basicas do pinecone
    pcapikey   = os.getenv("PINECONE_API_KEY")
    pinecone   = Pinecone(api_key = pcapikey)
    index_name = "rh-curriculo-analisador"

    
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

    doc_splitter = splitter()

    vector_store = pinecone(doc_splitter)

    model = ChatGoogleGenerativeAI(
        model="gemini-3.6-flash"
    )

    # Pega todos os IDs únicos
    ids_curriculos = list({
        doc.metadata["id"]
        for doc in doc_splitter
    })

    print("IDS DOS CURRÍCULOS:")
    print(ids_curriculos)

    # Analisa cada currículo
    for id_curriculo in ids_curriculos:

        print("\n")
        print("=" * 80)
        print("ANALISANDO CURRÍCULO:", id_curriculo)
        print("=" * 80)

        # Pega somente os chunks desse currículo
        documentos = vector_store.similarity_search(
            "currículo completo",
            k=10,
            filter={
                "id": id_curriculo
            }
        )

        contexto = "\n\n".join(
            doc.page_content
            for doc in documentos
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

llm()