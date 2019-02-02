// import * as es6Promise from 'es6-promise';
// es6Promise.polyfill();
// import 'isomorphic-fetch';
import { ApolloLink } from 'apollo-link';
import { ApolloClient } from 'apollo-client';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { HttpLink } from 'apollo-link-http';
import gql from 'graphql-tag';

/*
 * curl -X POST -H "Content-Type: application/json" --data '{ "query": "{ questions {category} }" }' http://localhost:4000
 */

export const questions = [
    {
        category: 'bible',
        question: "On which day of creation did God create Man?",
        choices: [
            "Day 3",
            "Day 4",
            "Day 6",
            "Day 7"
        ],
        answer: 2,
        answered: false
    },
    {
        category: 'bible',
        question: "How old was the prophet Daniel when he was taken to Babylon?",
        choices: [
            "20",
            "18",
            "10",
            "13"
        ],
        answer: 3,
        answered: false
    },
    {
        category: 'bible',
        question: "Which king came to greet Abram after his battle with the 5 kings in Genesis 14?",
        choices: [
            "Abemalech",
            "Melchizedek",
            "Nebuchadnezzar",
            "Sennacherib"
        ],
        answer: 1,
        answered: false
    }
];

// export function getQuestions() {
//     return fetch('http://localhost:4000/graphql', {
//         method: 'POST',
//         mode: 'cors',
//         cache: 'no-cache',
//         credentials: 'include',
//         headers: {
//             'Content-Type': 'application/json'
//         },
//         body: JSON.stringify('{query: { questions { category question choices answer answered } }, variables: {} }'),
//     })
//     .then(res => res.json())
//     .then(res => res.data);
// }
export function getQuestions() {
    const MY_QUERY = gql`
        query {
            questions {
                category
                question
                choices
                answer
                answered
            }
        }
    `;

    const client = new ApolloClient({
      link: new HttpLink({ uri: 'http://localhost:4000/graphql' }),
      cache: new InMemoryCache()
    });

    return client.query({
        query: MY_QUERY,
        context: {
            // example of setting the headers with context per operation
            headers: {
              special: "Special header value"
            }
        }
    })
    .then(response => response);
}







