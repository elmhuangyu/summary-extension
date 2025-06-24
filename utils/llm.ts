import { GoogleGenAI, GenerateContentConfig } from '@google/genai';
import { OpenAI } from 'openai';
import { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { encode } from 'gpt-tokenizer';

export enum Provider {
    OpenAI,
    Gemini,
    OpenAICompatible,
}

export class Model {
    provider: Provider
    baseUrl: string
    model: string
    apiKey: string
    maxToken: number

    constructor(provider: Provider,
        baseUrl: string,
        model: string,
        apiKey: string,
        maxToken: number) {
        this.provider = provider;
        this.baseUrl = baseUrl;
        this.model = model;
        this.apiKey = apiKey;
        this.maxToken = maxToken;
    }

    async check(): Promise<boolean> {
        if (this.provider == Provider.Gemini) {
            const ai = new GoogleGenAI({ apiKey: this.apiKey });
            try {
                await ai.models.list();
                return true;
            } catch (e) {
                return false;
            }
        }

        if (this.provider == Provider.OpenAI) {
            const ai = new OpenAI({
                apiKey: this.apiKey,
                dangerouslyAllowBrowser: true,
            });
            try {
                await ai.models.list();
                return true;
            } catch {
                return false;
            }
        }

        // for openai compatible, just send a chat see if success
        try {
            await this.openaiChat('what model you are', '');
            return true;
        } catch (e) {
            return false;
        }
    }

    async chatWithContent(prompt: string, cuttableContent: string, contentType: string, systemPrompt: string, thinking: boolean): Promise<string> {
        // each model use their own encoding, this counter is just a guess.
        const encoded = encode(prompt + cuttableContent);
        // leave room for format, systemPrompt & over optimistic guess.
        const maxInputToken = this.maxToken - 1024 * 2;
        // need to cut the content
        if (encoded.length > maxInputToken) {
            const percentage = maxInputToken / encoded.length;
            cuttableContent = cuttableContent.substring(0, percentage * cuttableContent.length);
        }

        // build the prompt
        const p = `${prompt}


\`\`\`${contentType}
${cuttableContent}
\`\`\`
`;

        return this.chat(p, systemPrompt, thinking);
    }

    async chat(prompt: string, systemPrompt: string, thinking: boolean): Promise<string> {
        if (this.provider == Provider.Gemini) {
            return this.geminiChat(prompt, systemPrompt, thinking);
        }
        return this.openaiChat(prompt, systemPrompt);
    }

    private async openaiChat(prompt: string, systemPrompt: string): Promise<string> {
        let baseUrl = 'https://api.openai.com/v1';
        if (this.provider === Provider.OpenAICompatible) {
            baseUrl = this.baseUrl;
        }
        const ai = new OpenAI({
            apiKey: this.apiKey,
            dangerouslyAllowBrowser: true,
            baseURL: baseUrl,
        });

        const messages: ChatCompletionMessageParam[] = [];
        if (systemPrompt !== '') {
            if (this.provider === Provider.OpenAI) {
                // Only openai is using developer role
                messages.push({
                    role: 'developer',
                    content: systemPrompt,
                });
            } else {
                messages.push({
                    role: 'system',
                    content: systemPrompt,
                });
            }
        }
        messages.push({
            role: 'user',
            content: prompt,
        });

        const completion = await ai.chat.completions.create({
            model: this.model,
            messages: messages,
        });
        const resp = completion.choices[0].message.content;
        return resp ? resp : '';
    }

    private async geminiChat(prompt: string, systemPrompt: string, thinking: boolean): Promise<string> {
        const ai = new GoogleGenAI({ apiKey: this.apiKey });
        const thinkingBudget = thinking ? -1 : 0;

        const config: GenerateContentConfig = {
            thinkingConfig: {
                thinkingBudget: thinkingBudget,
            },
            responseMimeType: 'text/plain',
            systemInstruction: [],
        };

        if (systemPrompt !== '') {
            config.systemInstruction = [{ text: systemPrompt }];
        }

        const contents = [
            {
                role: 'user',
                parts: [{ text: prompt }],
            },
        ];

        const response = await ai.models.generateContent({
            model: this.model,
            config,
            contents,
        });

        const text = response.text;
        if (!!text) {
            return text;
        }
        return '';
    }
}
