import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";
import { API_URL } from "./config";

console.log("🟢 apolloClient.js chargé avec URL:", API_URL);

const httpLink = createHttpLink({
  uri: API_URL,
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  connectToDevTools: true,
});

export default client;
