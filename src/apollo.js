import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// Force l'URL en production
const isProduction = window.location.hostname !== 'localhost';
const API_URL = isProduction 
  ? "https://finalproject-bu3e.onrender.com/api/graphql/"
  : "http://127.0.0.1:8000/api/graphql/";

console.log("🚀 API URL (apollo.js):", API_URL);
console.log("🌍 Hostname:", window.location.hostname);
console.log("📦 Is Production:", isProduction);

const httpLink = createHttpLink({
  uri: API_URL,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default client;
