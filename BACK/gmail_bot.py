import base64
import json

from dotenv import load_dotenv

from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    ToolMessage
)

from langchain_core.tools import tool

from langchain_google_genai import ChatGoogleGenerativeAI

from authentication import conectar_gmail

from pypdf import PdfReader


load_dotenv()

service = conectar_gmail()


# ============================================================
# TOOLS
# ============================================================

@tool
def listar_email():
    """
    Lista os primeiros 10 emails da caixa de entrada principal.
    Retorna ID, remetente, assunto e conteúdo do email.
    """

    resultados = service.users().messages().list(
        userId="me",
        q="in:inbox category:primary",
        maxResults=10
    ).execute()

    messages = resultados.get("messages", [])

    conteudo_emails = []

    for message in messages:

        msg = service.users().messages().get(
            userId="me",
            id=message["id"],
            format="full"
        ).execute()

        headers = msg["payload"].get("headers", [])

        remetente = ""
        assunto = ""

        for header in headers:

            if header["name"].lower() == "from":
                remetente = header["value"]

            elif header["name"].lower() == "subject":
                assunto = header["value"]

        snippet = msg.get("snippet", "")

        conteudo_emails.append({
            "id": message["id"],
            "remetente": remetente,
            "assunto": assunto,
            "conteudo": snippet
        })

    return conteudo_emails


@tool
def baixar_anexo(email_ids: list[str]):
    """
    Recebe os IDs dos emails classificados como currículos,
    baixa os PDFs anexados e extrai o texto.
    """

    resultados = []

    for email_id in email_ids:

        email = service.users().messages().get(
            userId="me",
            id=email_id,
            format="full"
        ).execute()

        headers = email["payload"].get("headers", [])

        remetente = ""
        assunto = ""

        for header in headers:

            if header["name"].lower() == "from":
                remetente = header["value"]

            elif header["name"].lower() == "subject":
                assunto = header["value"]

        partes = email["payload"].get("parts", [])

        for part in partes:

            if part.get("mimeType") != "application/pdf":
                continue

            attachment_id = part["body"].get("attachmentId")

            if not attachment_id:
                continue

            attachment = service.users().messages().attachments().get(
                userId="me",
                messageId=email_id,
                id=attachment_id
            ).execute()

            pdf = base64.urlsafe_b64decode(
                attachment["data"]
            )

            nome_arquivo = f"curriculo_{email_id}.pdf"

            with open(nome_arquivo, "wb") as arquivo:
                arquivo.write(pdf)

            print("PDF baixado!")

            reader = PdfReader(nome_arquivo)

            texto_completo = ""

            for pagina in reader.pages:

                texto = pagina.extract_text()

                if texto:
                    texto_completo += texto + "\n"

            resultados.append({
                "email_id": email_id,
                "remetente": remetente,
                "assunto": assunto,
                "texto": texto_completo
            })

    return resultados


# ============================================================
# IA
# ============================================================

llm = ChatGoogleGenerativeAI(
    model="gemini-3.6-flash"
)

llm_with_tools = llm.bind_tools([
    listar_email,
    baixar_anexo
])


SYSTEM_PROMPT = """

Você é um agente responsável por fazer triagem de currículos
recebidos por email.

Siga obrigatoriamente este fluxo:

1. Chame a ferramenta listar_email.

2. Analise os emails retornados.

3. Identifique quais emails são currículos ou candidaturas.

4. Ignore emails que não tenham relação com:
   - currículo
   - candidatura
   - emprego
   - vaga
   - recrutamento

5. Pegue exatamente os IDs dos emails classificados como currículos.

6. Chame a ferramenta baixar_anexo passando uma lista contendo
   SOMENTE esses IDs.

7. A ferramenta baixar_anexo irá baixar os PDFs e extrair os textos.

8. Depois de receber os textos dos currículos, gere o resultado
   final em JSON.

9. dentro do texto extraído procure pelo nome do candito a vaga 
REGRAS:

- Nunca invente IDs.
- Use exatamente os IDs retornados por listar_email.
- Nunca chame baixar_anexo antes de listar_email.
- Não baixe anexos de emails que não sejam currículos.
- Não considere um email como currículo apenas porque possui PDF.
- Não escreva explicações fora do JSON.

O resultado final deve ser SOMENTE JSON válido.

Formato:

{
    "curriculos": [
        {
            "email_id": "ID",
            "remetente": "EMAIL",
            "nome": "NOME",
            "texto_curriculo": "TEXTO EXTRAIDO"
        }
    ]
}

Se nenhum currículo for encontrado:

{
    "curriculos": []
}

"""


# ============================================================
# AGENTE
# ============================================================

def classification_bot():

    mensagens = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(
            content="Faça a triagem dos emails recebidos."
        )
    ]

    while True:

        resposta = llm_with_tools.invoke(mensagens)

        mensagens.append(resposta)

        # ----------------------------------------
        # IA terminou
        # ----------------------------------------

        if not resposta.tool_calls:

            print(resposta.content)

            return resposta.content

        # ----------------------------------------
        # IA pediu alguma ferramenta
        # ----------------------------------------

        for tool_call in resposta.tool_calls:

            nome = tool_call["name"]

            argumentos = tool_call["args"]

            print(
                f"IA chamou: {nome}"
            )

            print(
                f"Argumentos: {argumentos}"
            )

            # ----------------------------------------
            # listar_email
            # ----------------------------------------

            if nome == "listar_email":

                resultado = listar_email.invoke(
                    argumentos
                )

            # ----------------------------------------
            # baixar_anexo
            # ----------------------------------------

            elif nome == "baixar_anexo":

                resultado = baixar_anexo.invoke(
                    argumentos
                )

            else:

                raise ValueError(
                    f"Tool desconhecida: {nome}"
                )

            # ----------------------------------------
            # devolve resultado para a IA
            # ----------------------------------------

            mensagens.append(
                ToolMessage(
                    content=json.dumps(
                        resultado,
                        ensure_ascii=False
                    ),
                    tool_call_id=tool_call["id"]
                )
            )


classification_bot()