import { ApolloServer, gql } from "apollo-server";
import axios from "axios";
import cheerio from "cheerio";

const typeDefs = gql`
  type Concert {
    title: String!
    performer: String!
    month: String!
    year: String!
    time: String!
    day: String!
    weekday: String!
  }
  type Performer {
    name: String!
    mbid: String!
    url: String!
    listeners: String!
    streamable: String!
  }
  type Query {
    allConcerts: [Concert!]!
    allPerformers: [Performer!]!
  }
`;
const resolvers = {
  Query: {
    allConcerts() {
      return axios
        .get("https://www.livenation.kr/event/allevents")
        .then((html) => {
          let concertList = [];
          const $ = cheerio.load(html.data);
          // ul.list--posts를 찾고 그 children 노드를 bodyList에 저장
          const bodyList = $("ul.allevents__eventlist").children(
            "li.allevents__eventlistitem"
          );

          // bodyList를 순회하며 titleList에 h2 > a의 내용을 저장
          bodyList.each(function (i, elem) {
            concertList[i] = {
              title: $(this).find(".result-info__localizedname").text(),
              performer: $(this).find(".result-info__headliners").text(),
              month: $(this).find(".event-date__date__month").text(),
              year: $(this).find(".event-date__date__year").text(),
              time: $(this).find(".event-date__date__time").text(),
              day: $(this).find(".event-date__date__day").text(),
              weekday: $(this).find(".event-date__date__weekday").text(),
            };
          });

          return concertList;
        });
    },
    allPerformers() {
      return axios
        .get(
          "https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=" +
            "justin" +
            "&api_key=8ebd7023ea5bf92e4f875cc362a8344a&format=json"
        )
        .then((json) => json.data.results.artistmatches.artist);
    },
  },
};
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Running on ${url}`);
});
