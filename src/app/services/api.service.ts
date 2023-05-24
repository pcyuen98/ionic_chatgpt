import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Configuration, OpenAIApi } from 'openai';
import { BehaviorSubject } from 'rxjs';

const configuration = new Configuration({
  apiKey: environment.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

enum Creator {
  Me = 0,
  Bot = 1,
}

interface Message {
  text: string;
  from: Creator;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  dummyMessages = [
    {
      text: 'How do i use this?',
      from: Creator.Me,
    },
    {
      text: 'Ask anything here. We will use latest AI tech to answer your ques.',
      from: Creator.Bot,
    },
  ];
  private messages = new BehaviorSubject<Message[]>(this.dummyMessages);

  constructor(private http: HttpClient) {}

  async getCompletion(prompt: string) {

    
    let response = await this.submitToBE(prompt, true);

    if (this.isFalseStatement(response)) {
      response = await this.submitToBE(prompt + '. Sorry, this is kids friendly app. Bot to suggest better sentence.', false);
      response = 'Your question been filtered. Suggest you ask by this sentence.' + response;
    }
    else {
      response = await this.submitToBE(prompt, false);
    }
    this.setMessage(response);

    return true;
  }

  isFalseStatement(response: string) {
    console.log("response->" + response);
    if ( response.indexOf('Yes,') > -1) {
      return true;
    }

    return false;
  } 

  async submitToBE(prompt: string, isTestWord: boolean) {
    const newMessage = {
      text: prompt,
      from: Creator.Me,
    };

    if (!isTestWord) {
      this.messages.next([...this.messages.getValue(), newMessage]);
    }

    let testSentence = prompt + '. Is this sentence sounds negative?';
    if (isTestWord) {
      prompt = testSentence;
    }

    const aiResult = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: `${prompt}`,
      temperature: 0.9, // Higher values means the model will take more risks.
      max_tokens: 2048, // The maximum number of tokens to generate in the completion.
      frequency_penalty: 0.5, // Number between -2.0 and 2.0.
      presence_penalty: 0, // Number between -2.0 and 2.0.
    });
    console.log(
      '🚀 ~ file: api.service.ts:26 ~ ApiService ~ getCompletion ~ aiResult',
      aiResult
    );

    const response =
      aiResult.data.choices[0].text?.trim() || 'Sorry, there was a problem!';

    return response;
  }

  setMessage(response: any) {
    const botMessage = {
      text: response,
      from: Creator.Bot,
    };

    this.messages.next([...this.messages.getValue(), botMessage]);
  }


  getMessages() {
    return this.messages.asObservable();
  }
}
