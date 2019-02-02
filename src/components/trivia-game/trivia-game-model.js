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
            headers: {
              special: "Special header value"
            }
        }
    })
    .then(response => response);
}







