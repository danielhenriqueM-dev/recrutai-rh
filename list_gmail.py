from authentication import conectar_gmail


service = conectar_gmail()



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


