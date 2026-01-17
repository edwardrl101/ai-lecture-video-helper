import express, { type Request, type Response, type Application } from 'express';

const app: Application = express();
const PORT = 3000;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello from TypeScript + Express!');
});

app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});