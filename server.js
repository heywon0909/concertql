import { ApolloServer, gql } from "apollo-server";
import axios from "axios";
import fetch from "node-fetch";
import cheerio from "cheerio";

let favorites = [];
let performers = [];
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
    id:String!
    type:String!
    score:String!
    name:String!
    gender:String
    country:String
    img:[String!]!
  }
  type Watcher {
    artist:Performer
    updateConcert: Concert
  }
  type Query {
    allConcerts: [Concert!]!
    allPerformers: [Performer!]!
    Favorites:[Watcher]!
  }
  type Mutation{
    addFavorite(id:String!):Watcher!
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
      return fetch(
        "https://musicbrainz.org/ws/2/artist/?query=artist:" +
          "justin" +
          "&fmt=json"
      )
        .then((r) => r.json())
        .then((json) => {
         
          performers = json.artists;
         
          return performers;
        });
      // return axios
      //   .get(
      //     "https://ws.audioscrobbler.com/2.0/?method=artist.search&artist=" +
      //       "maroon" +
      //       "&api_key=8ebd7023ea5bf92e4f875cc362a8344a&format=json"
      //   )
      //   .then((json) => json.data.results.artistmatches.artist);
    },
    Favorites() {
      return this.Favorites;
    }
  },
  Mutation: {
    addFavorite(_, { id }) {
 
      const select = performers.find(performer => performer.id === id);
      const { country, gender, name, score, type } = select;
      // console.log('select', select);
      const newFavorite = {
        artist: { country, gender, id,name, score, type },
        updateConcert: null
      }
      console.log('newFA', newFavorite);
      favorites.push(newFavorite);
      return newFavorite;
    }
  },
  Performer: {
    img({ id }) {
      if (!id) return [];
      const url =
        "https://musicbrainz.org/ws/2/artist/" +
        id +
        "?inc=url-rels&fmt=json";
      console.log(url);
      return fetch(url)
        .then((r) => r.json())
        .then((out) => {
          const { relations } = out;
          console.log('relations', relations);

          if (relations) {
            let arr = [];
            relations.forEach((item) => {
              // console.log("item", item.type);
              if (item.type === "image") {
                let image_url = item.url.resource;
                if (
                  image_url.startsWith(
                    "https://commons.wikimedia.org/wiki/File:"
                  )
                ) {
                  const filename = image_url.substring(
                    image_url.lastIndexOf("/") + 1
                  );
                  image_url =
                    "https://commons.wikimedia.org/wiki/Special:Redirect/file/" +
                    filename;
                }
                console.log(image_url);
                arr.push(image_url);
              }
            });
            console.log("arr", arr);
            return arr;
          } else return [];
        })
        .catch((err) => {
          throw console.log(err);
        });
    },
  },
};
const server = new ApolloServer({ typeDefs, resolvers });

server.listen().then(({ url }) => {
  console.log(`Running on ${url}`);
});
