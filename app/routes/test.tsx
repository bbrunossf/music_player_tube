// routes/test.tsx
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";

export async function loader({ request }: LoaderFunctionArgs) {
    // ✅ Variáveis de ambiente funcionam no servidor
    const apiUrl = process.env.API_URL_HEALTH || "http://localhost:5000/api/health";
    
    return json({
        apiUrl
    });
}

export default function TestConnection() {
    const { apiUrl } = useLoaderData<typeof loader>();
    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState<string>("");

    useEffect(() => {
        const checkConnection = async () => {
            setStatus("loading");
            try {
                console.log("API URL:", apiUrl); // ✅ Agora funciona
                
                const response = await fetch(apiUrl);
                if (response.ok) {
                    const data = await response.json();
                    setMessage(data.status || "Connected to backend!");
                    setStatus("success");
                } else {
                    setMessage("Failed to connect to backend.");
                    setStatus("error");
                }
            } catch (error) {
                setMessage("Error connecting to backend.");
                setStatus("error");
            }
        };

        checkConnection();
    }, [apiUrl]);

    return (
        <div>
            <h1>Backend Connection Test</h1>
            <p>Status: {status}</p>
            <p>{message}</p>
            <p>API URL: {apiUrl}</p>
        </div>
    );
}