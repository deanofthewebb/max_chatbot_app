const express = require('express')
const bodyParser = require('body-parser')
const {WebhookClient} = require('dialogflow-fulfillment');
const OpenAI = require('openai-api');
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const openai = new OpenAI(OPENAI_API_KEY);
const app = express()
app.use(bodyParser.json())
const port = process.env.PORT || 3000

app.post('/dialogflow-fulfillment', (request,response) => {
    dialogFlowFulfillment(request, response)
})

app.listen(port, () => {
    console.log(`Listening on port ${port}`)
})

const dialogFlowFulfillment = (request,response) => {
    const agent = new WebhookClient({request, response})

    async function callOpenAIAPI(agent){
        console.log(`Query input: ${agent.query}`)
        
        const gptResponse = await openai.complete({
            engine: 'davinci',
            prompt: `I am a Five year old question answering bot. If you ask me a question, 
                        I will give you the answer as a 5 year old would.
                        \n\nQ: What is something mommy always says to you? 
                        \nA: Mommy says “Yes”.
                        \n\nQ: What makes you happy? 
                        \nA: Toys.
                        \n\nQ: What makes you sad? 
                        \nA: Pointing makes me sad. Pointy things.
                        \n\nQ:  What makes you laugh? 
                        \nA: Helicopters make me laugh!
                        \n\nQ: How old are you? 
                        \nA: Five.
                        \n\nQ: How old is Mommy?
                        \nA:  Four! She is four.
                        \n\nQ: ${agent.query}
                        \n`,
            maxTokens: 300,
            temperature: 0.9,
            topP: 1,
            presencePenalty: 0,
            frequencyPenalty: 0,
            bestOf: 1,
            n: 1,
            stream: false,
            stop: ["\n","\nA: ","\n\nQ: "]
        });
     
        console.log(`Chatbot response: ${gptResponse.data.choices[0].text}`);
        agent.add(`${gptResponse.data.choices[0].text}`.replace("A:","").replace("\"",""));
    }

    let intentMap = new Map();
    intentMap.set("Default Welcome Intent", callOpenAIAPI)
    intentMap.set("Default Fallback Intent", callOpenAIAPI)
    agent.handleRequest(intentMap)
}