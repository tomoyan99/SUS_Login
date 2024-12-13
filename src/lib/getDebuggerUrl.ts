export async function getDebuggerUrl(port: number): Promise<string|void>{
    const url = `http://127.0.0.1:${port}/json/version`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        return data.webSocketDebuggerUrl;
    } catch (error:unknown) {
        if(error instanceof Error) {
            throw new Error(`Request failed: ${error.message}`);
        }else{
            throw error;
        }
    }
}
