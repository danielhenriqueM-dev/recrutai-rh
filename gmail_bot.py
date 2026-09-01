import base64
import json
from dotenv import load_dotenv
from list_gmail import listar_email
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.tools import tool 
from authentication import conectar_gmail
from pypdf import PdfReader

load_dotenv()
service = conectar_gmail()

def  classification_bot():


    emails  = listar_email()

    texto_emails = "\n\n".join(emails)

    llm = ChatGoogleGenerativeAI(model="gemini-3.6-flash")

    system_prompt = (    
                        " classifique se o email é um curriculo , se não for o ignore , "
                        " se for retorne O NUMERO DO ID desse email " 
                        " não escreva 'ID:', não escreva explicações e não use markdown. "
                        " Se nenhum email for currículo, retorne 'NENHUM'."
                    )   


    resposta = llm.invoke([

            SystemMessage(content=system_prompt),
            HumanMessage(content=f"E-mails:\n{texto_emails}")
        ])

    print(resposta.content[0]["text"])
    return resposta.content[0]["text"]












# TOOLS 

@tool

def listar_email():


    resultados = service.users().messages().list(

        userId     = "me",
        q          ="in:inbox category:primary",
        maxResults = 10

    ).execute() 

    messages = resultados.get("messages", [])
    conteudo_emails = []

    for message in messages:


        msg = (
            service.users().messages().get(

                userId = "me", 
                id      = message["id"]
            ).execute()
        )   

        snippet = msg.get("snippet", "")
        conteudo_emails.append(f"ID: {message['id']} - Conteúdo: {snippet}")


    
    return conteudo_emails





def baixar_anexo():

    email_ids = classification_bot().splitlines()
    
    for email_id in email_ids:

        email = service.users().messages().get(

            userId = "me",
            id     =  email_id

        ).execute() 

        for part in email["payload"]["parts"]:

            if part.get("mimeType") == "application/pdf":

                attachment_id = part["body"]["attachmentId"]

                attachment = service.users().messages().attachments().get(


                    userId    = "me",
                    messageId = email_id,
                    id        = attachment_id 

                ).execute()

                pdf = base64.urlsafe_b64decode(attachment["data"])

                with open(f"curriculo_{email_id}.pdf", "wb") as arquivo:

                    arquivo.write(pdf)

                    print("PDF baixado!")

                reader = PdfReader(f"curriculo_{email_id}.pdf")
                
                texto_completo = ""
                    
                for pagina in reader.pages:
                    
                    texto_completo += pagina.extract_text()