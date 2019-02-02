import {bind,wire} from 'hyperhtml';
import delegate from 'dom-delegate';
import './trivia-game.css';
import '../trivia-question/trivia-question';
import {getQuestions} from './trivia-game-model';

class TriviaGame extends HTMLElement {
    static get observedAttributes() { return ['type']; }

    connectedCallback() {
        this.connected = true;
        this.html = bind(this);
        this.type = this.type || this.getAttribute('type');
        getQuestions()
            .then(response => {
                this.questions = response.data.questions;
                this.state = {
                    question: this.getQuestion(this.type),
                    status: {isAnswered: false, isCorrect: false}
                }
                this.render(this.html, this.state);
                this.addEventListeners();
            });
    }

    disconnectedCallback() {
        this.delegateEl.off();
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        if (oldValue !== newValue) {
            this[attr] = newValue;
            this.render(this.html);
        }
    }

    propertyChangeCallback(prop, oldValue, newValue) {
        if (oldValue !== newValue) {
            this.setAttribute(prop, newValue);
            this.render(this.html, this.state);
        }
    }

    addEventListeners() {
        this.delegateEl = delegate(this);
        this.delegateEl.on('trivia-question:answered', '.trivia-question', (e) => {
            if (e.detail) {
                this.state.status.isAnswered = true;
                this.state.status.isCorrect = e.detail.answerIsCorrect;
            }
            this.render(this.html, this.state);
        })
        this.delegateEl.on('click', '.next-question-button', () => {
            this.state = {
                question: this.getQuestion(this.type),
                status: {isAnswered: false, isCorrect: false}
            };
            this.render(this.html, this.state);
        })
    }

    getRandomQuestion(array) {
        const max =  array.length;
        const randomInt = Math.floor(Math.random() * Math.floor(max));
        this.isAnswered = false;
        this.isCorrect = false;
        return array[randomInt];
    }

    getQuestion(category) {
        const questionsByCategory = this.questions.filter(q => q.category === category);
        return this.getRandomQuestion(questionsByCategory);
    }

    render(html, state) {
        if (!this.connected) { return '';}
        return html`
            <h1 class="trivia-game__title">${ this.type } Trivia</h1>
            <div class="trivia-game__question-container">
                ${!this.state.status.isAnswered
                    ? ''
                    : this.state.status.isCorrect
                        ? wire()`<p class="is-correct">CORRECT</p>`
                        : wire()`<p class="is-incorrect">INCORRECT</p>`
                    }
                ${!this.state.status.isAnswered
                    ? wire()`<trivia-question class="trivia-question" data=${ state } />`
                    : wire()`<button class="next-question-button" type="button">Next Question<button>`
                }
            </div>
        `;
    }
}

customElements.define('trivia-game', TriviaGame);
