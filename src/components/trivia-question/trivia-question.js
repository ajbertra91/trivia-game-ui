import {bind} from 'hyperhtml';
import delegate from 'dom-delegate';
import './trivia-question.css';

class TriviaQuestion extends HTMLElement {
    static get observedAttributes() { return ['data']; }

    connectedCallback() {
        this.connected = true;
        this.html = bind(this);
        this.data = this.data || this.getAttribute('data');
        this.render(this.html);
        this.addEventListeners();
    }

    disconnectedCallback() {
        this.delegateEl.off();
    }

    attributeChangedCallback(attr, oldValue, newValue) {
        console.log("attr: ", attr);
        if (oldValue !== newValue) {
            this[attr] = newValue;
            this.render(this.html);
        }
    }

    propertyChangeCallback(prop, oldValue, newValue) {
        console.log("prop: ", prop);
        if (oldValue !== newValue) {
            this.setAttribute(prop, newValue);
            this.render(this.html);
        }
    }

    emitEvent(msg, detail) {
        var event = new CustomEvent(msg, {bubbles: true, detail});
        this.dispatchEvent(event);
    }

    addEventListeners() {
        this.delegateEl = delegate(this);
        this.delegateEl.on('click', '.trivia-question__choice', e => {

            if (this.data.status.isAnswered) { return; }

            const choice = parseInt(e.target.getAttribute('data-choice'));
            const isCorrect = choice === this.data.question.answer;
            this.emitEvent('trivia-question:answered', {answerIsCorrect: isCorrect})
        })
    }

    render(html) {
        if (!this.connected) { return '';}
        return html`
            <div class="trivia-question">
                <h2 class="trivia-question">${this.data.question.question}</h2>

                <ul>
                    ${this.data.question.choices.map((choice,idx) => {
                        return`
                            <li>
                                <button
                                    class="trivia-question__choice"
                                    data-choice="${idx}"
                                    type="button"
                                    >
                                    ${choice}
                                </button>
                            </li>
                        `;
                    })}
                </ul>
            </div>
        `;
    }
}

customElements.define('trivia-question', TriviaQuestion);
