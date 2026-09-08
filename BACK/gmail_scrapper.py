import os
import base64

from dotenv import load_dotenv
from Auth.authentication import conectar_gmail
from pypdf import PdfReader

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
from dotenv import load_dotenv
#como vai se tornar um sistema que vai continuar na empresa depois que eu sair, vou tentar deixar tudo mais documentado possivel

load_dotenv()

# palavras passe - fora da função para n ser criada toda vez que puxa a função 
subject_curriculo = [

    
    "currículo",
    "curriculo",
    "cv",
    "c.v.",
    "resume",
    "resumé",
    "curriculum",
    "curriculum vitae",
    "envio de currículo",
    "envio do currículo",
    "enviando currículo",
    "envio de cv",
    "envio do cv",
    "currículo profissional",
    "curriculo profissional",
    "currículo atualizado",
    "curriculo atualizado",

    
    "candidatura",
    "candidatura à vaga",
    "candidatura a vaga",
    "candidatura para vaga",
    "candidatura espontânea",
    "vaga",
    "vaga de emprego",
    "vaga de trabalho",
    "oportunidade",
    "oportunidade de emprego",
    "oportunidade profissional",
    "processo seletivo",
    "processo de seleção",
    "candidato",
    "perfil profissional",
    "apresentação profissional",
    "interesse na vaga",
    "interesse profissional",


    "vendedor externo",
    "supervisor externo",
    "vendedor online",
    "auxiliar administrativo",
    "assistente de rh",
    "analista de ti",
    "jovem aprendiz",
    "operador de caixa",
    "montador",
    "auxiliar mecânico",
    "auxiliar serviços gerais",
    "auxiliar de serviços gerais",
    "assistente de administrativo",
    "assistente administrativo",
    "auxiliar administrativo credere",
    "assistente administrativo emplacamento",
    "assistente administrativo consorcio",
    "assistente administrativo consórcio",
    "vendedora",
    "vendedora show room",
    "vendedora showroom",
    "show room",
    "showroom",
    "assistente de faturamento",
    "jovem aprendiz faturamento",
    "jovem aprendiz pós vendas",
    "jovem aprendiz pós-vendas",
    "estagiário de arquivologia",
    "estagiária contábil",
    "estagiario de arquivologia",
    "estagiaria contabil",
    "estagiária de adm pessoal",
    "estagiario de adm pessoal",
    "estagiário de adm pessoal",
    "garantista",
    "gerente de pós vendas",
    "gerente de pós-vendas",
    "motorista"

]

def gmail_inbox():

    gmail = conectar_gmail()

    
    inbox = gmail.users().messages().list(

            userId     = "me",
            q          = "in:inbox category:primary", # se n especificar vai puxar da caixa de spam tbm 
            maxResults =  20

    ).execute()   # puxa as 20 primeiras menssagens do inbox

    print(" PUXANDO INBOX  ")

    inbox_msg     =  inbox.get("messages",[]) 

    gmail_content = []

    for msgs in inbox_msg:

        print(" SELECIONANDO MENSSAGENS ")

        msg = gmail.users().messages().get(

            userId = "me",
            id     = msgs["id"],
            format = "full"

        ).execute()  # vai por menssagem em messagem retornando todo conteudo dela, no inbox ele so retorna o ID e o ID trhead, aqui ele usa esses ids para puxar o conteudo inteiro da menssagem

        snippet     = msg.get("snippet")
        headers_msg = msg["payload"].get("headers")   # puxa o cabeçalho do email, quem eviou , o email , name etcetcetc


        #estou criando aqui para caso o email n tenha algum dos dois ele n dê erro 
        assunto = ""
        header  = ""

        for header in headers_msg:

        # uma representação visual de como o header ta agr  
        #    headers = [    
        #       {"name": "From", "value": "joao@gmail.com"},
        #        {"name": "To", "value": "humberto@gmail.com"},
        #        {"name": "Subject", "value": "Meu currículo"},
        #        {"name": "Date", "value": "04 Sep 2026"}
        #    ]
        # ele faz várias voltas passando por cada parte do header até o fim   
            
            if header["name"].lower()   == "from":

                print( " PUXANDO O REMETENTE ")
                remetente = header["value"]

            elif header["name"].lower() == "subject":

                print( " PUXANDO O SUBJECT ")
                assunto = header["value"]


        #verifica se tem alguma palavra passa no subject do email , independente se for maiúscula ou minuscula 

        if any(pass_word.lower() in assunto.lower() for pass_word in subject_curriculo):

            print( " CURRICULO ")

            gmail_content.append({
            
                            "id" : msg["id"],
                            "remetente" : remetente,
                            "assunto"   : assunto,
                            "conteudo"  : snippet
                    })
        else:
            print(" NÃO SE CLASSIFICA COMO UM CURRICULO")

    
    return gmail_content


def  attachment():

    emails = gmail_inbox()
    gmail  = conectar_gmail()

    #lista dos conteudos dos anexos em base 64 que a gente vai pegar
    attachments = []

    # aqui a gente ta buscando os email completos dos IDs selecionados 
    for email in emails:

        get_full_email = gmail.users().messages().get(              

            userId   = "me",
            id       =  email["id"],
            format   = "full"
        ).execute() 

        print("RESGATANDO EMAIL DE CANDIDATOS JA SELECIONADOS")

        #retorna uma lista parecida com o heardes
        partes = get_full_email["payload"].get("parts",[])                 

        for part in partes:

            print("PROCURANDO ANEXO")
            # rodamos a lista até acharmos o id do anexo 
            attachment_id = part.get("body", {}).get("attachmentId")

            
            if attachment_id: 

                print("ANEXO ENCONTRADO")

                attachment = gmail.users().messages().attachments().get(

                    userId    = "me",
                    messageId = email["id"],
                    id        = attachment_id

                ).execute() # pegamos o conteudo do pdf em base 64

                print("ANEXO BAIXADO EM BASE 64")

                attachments.append({

                    "id"       : email["id"],
                    "remetente": email["remetente"],
                    "data"     : attachment["data"]

                    })

    
    return attachments


def get_curriculum():

    anexos = attachment() 

    curriculo = []

    # baixar o pdf
    
    for anexo in anexos:
        
        pdf = base64.urlsafe_b64decode(

            anexo["data"]

        )

        name_file = f' curriculo_{anexo["id"]}.pdf'

        with open(name_file, "wb") as file:

            file.write(pdf)

        print(" PDF BAIXADO ")

        # ler pdf 
        
        reader = PdfReader(name_file)

        #onde vai ficar armazenado o texto inteiro do curriculo
        full_text = ""

        #passamos página por página do pdf
        for page in reader.pages:

            text = page.extract_text()

            if text:

                full_text += text

        curriculo.append({

            "id"        : anexo["id"],
            "remetente" : anexo["remetente"],
            "curriculo" : full_text
        })

    
    return curriculo

def firebase():

    curriculo = get_curriculum()

    credentials_path = os.getenv("FIREBASE_CREDENTIALS_PATH")

  
    credential = credentials.Certificate(credentials_path)
    firebase_admin.initialize_app(credential)

    db = firestore.client()

    for candidato in curriculo:

        doc_ref = db.collection("curriculos").add(candidato)

        print(f"Documento criado com ID: {doc_ref[1].id}")


firebase()

    