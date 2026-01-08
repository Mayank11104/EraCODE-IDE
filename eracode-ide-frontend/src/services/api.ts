import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000',
});

export const generateDiagram = async (description: string) => {
    const response = await API.post('/routes/generate-diagram', { description });
    return response.data;
};

export const editDiagram = async (diagram: string, instructions: string) => {
    const response = await API.post('/routes/edit-diagram', { diagram, instructions });
    return response.data;
};
