require('dotenv').config();
const fetch = require("node-fetch");
const smoke = require("@smokenetwork/smoke-js");

// constants
const SPONSOR_API_LIST_URL = "https://api.smoke.io/sponsorapi/list";
const VOTER_NAME = '';
const VOTER_WIF = process.env.VOTER_WIF;
const ONEDAY = 24 * 60 * 60 * 1000;

// global vars
var sponsors = [];


const sleep = (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

// if author posted in the last day
const checkRecentPost = async (name) => {
  let dateData = await smoke.api.getDiscussionsByAuthorBeforeDateAsync(name,null, new Date().toISOString().split('.')[0],1 , );
  let timeCreated = Date.parse(dateData[0].created);
  let timeNow = Date.now();
  let difference = timeNow - timeCreated;
  if (difference < ONEDAY) {
    console.log("no posts in the last day " + difference);
    return true;
  }

  return false;
};

const process_comment = async (name, link) => {
  ////////// Validating
  // Needed to check if they a sponsor
  let isSponsor = false;
  for (let i = 0; i < sponsors.length; i++) {
    if (sponsors[i].accountname === name) {
      isSponsor = true;
    };
  };
  if (check === false) {
    console.log("Not sponsor");
    return;
  }

  // Needed to see if they posted in the last day
  const isRecentPost = await checkRecentPost(name);
  if (isRecentPost === false) {
    console.log("posted too old");
    return;
  }

  ////////// Processing here
  // Needed for voting weight
  let voteWeight = 10000;
  if (sponsors.length > 10) {
    voteWeight = 100000 / sponsors.length;
  }

  await smoke.broadcast.voteAsync(VOTER_WIF, VOTER_NAME, name, link, weight);
};

const main = async () => {
  // fetch sponsors to global data to be able to re-use later
  const res = await fetch(SPONSOR_API_LIST_URL);
  sponsors = await res.json();

  await sleep(5000);
  const txs = await smoke.api.streamOperations("head",(error, operation) => {
    // async in callback ?!
    let txType = result[0];
    let txData = result[1];
    if (txType === "comment" && txData.parent_author === '') {
      process_comment(txData.author, txData.permlink);
    }
  });
};

main();
