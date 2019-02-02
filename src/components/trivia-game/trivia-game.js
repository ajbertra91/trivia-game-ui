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
                this.score = 0;
                this.state = {
                    status: 'incomplete',
                    question: this.getQuestion(this.type),
                    status: {isAnswered: false, isCorrect: false},
                    score: this.score
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
                this.score += e.detail.answerIsCorrect ? 100 : 0;
                this.state.score = this.score;
            }
            this.render(this.html, this.state);
        })
        this.delegateEl.on('click', '.next-question-button', () => {
            if (this.questions.length > 0) {
                this.state = {
                    status: 'incomplete',
                    question: this.getQuestion(this.type),
                    status: {isAnswered: false, isCorrect: false},
                    score: this.score
                };
            } else {
                this.state = {
                    status: 'complete',
                    question: this.getQuestion(this.type),
                    status: {isAnswered: false, isCorrect: false},
                    score: this.score
                };
            }
            this.render(this.html, this.state);
        })
    }

    getQuestion() {
        const max =  this.questions.length;
        const randomInt = Math.floor(Math.random() * Math.floor(max));
        const question = this.questions[randomInt]
        this.questions.splice(randomInt,1);
        return question;
    }

    render(html, state) {
        if (!this.connected) { return '';}
        return html`
            <h1 class="trivia-game__title">${ this.type } Trivia</h1>
            <p class="trivia-game__score">Score: ${ this.state.score }</p>
            <div class="trivia-game__question-container">
                ${!this.state.status.isAnswered
                    ? ''
                    : this.state.status.isCorrect
                        ? wire()`
                            <div class="answer-message">
                                <p class="is-correct">CORRECT</p>
                            </div>
                        `
                        : wire()`
                            <div class="answer-message">
                                <p class="is-incorrect">INCORRECT</p>
                                <p class="correct-answer">${this.state.question.choices[this.state.question.answer]}</p>
                            </div>
                        `
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
