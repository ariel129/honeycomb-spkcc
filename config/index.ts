const ENV = process.env;
const VERSION: string = 'v1.2.7';

const username: string = ENV.account || 'disregardfiat';
const active: string = ENV.active || '';
const follow: string = ENV.follow || 'disregardfiat';
const msowner: string = ENV.msowner || '';
const mspublic: string = ENV.mspublic || '';
const memoKey: string = ENV.memo || '';
const hookurl: string = ENV.discordwebhook || '';
const NODEDOMAIN: string = ENV.domain || 'http://dlux-token.herokuapp.com'; //where your API lives
const acm: boolean | string = ENV.account_creator || false; //account creation market ... use your accounts HP to claim account tokens
const mirror: boolean | string = ENV.mirror || false; //makes identical posts, votes and IPFS pins as the leader account
const port: number | string = ENV.PORT || 3001;
const pintoken: string = ENV.pintoken || '';
const pinurl: string = ENV.pinurl || '';
const status = ENV.status || true;
const dbcs: string = ENV.DATABASE_URL || '';
const history: number | string = ENV.history || 3600;
const stream: string = ENV.stream || 'irreversible';
const mode: string = ENV.mode || 'normal';

// testing configs for replays
const override: string = ENV.override || '0'; //69116600 //will use standard restarts after this blocknumber
const engineCrank: string =
  ENV.startingHash || 'QmconUD3faVGbgC2jAXRiueEuLarjfaUiDz5SA74kptuvu'; //but this state will be inserted before

// third party configs
const rta: string = ENV.rta || ''; //rtrades account : IPFS pinning interface
const rtp: string = ENV.rtp || ''; //rtrades password : IPFS pinning interface

const ipfshost: string = ENV.ipfshost || 'ipfs.infura.io'; //IPFS upload/download provider provider
const ipfsport: string = ENV.ipfsport || '5001'; //IPFS upload/download provider provider
const ipfsprotocol: string = ENV.ipfsprotocol || 'https'; //IPFS upload/download protocol
const ipfsLinks = ENV.ipfsLinks
  ? ENV.ipfsLinks.split(" ")
  : [
      "https://ipfs:8080/ipfs/",
      "http://localhost:8080/ipfs/",
      "https://ipfs.3speak.tv/ipfs/",
      "https://infura-ipfs.io/ipfs/",
      "https://ipfs.alloyxuast.co.uk/ipfs/",
      "https://ipfs1.alloyxuast.tk/ipfs/"
    ];

const startURL: string = ENV.STARTURL || 'https://api.deathwing.me/';
const clientURL: string = ENV.APIURL || 'https://api.deathwing.me/';
const clients: string | string[] = ENV.clients || [
  'https://api.deathwing.me/',
  //"https://api.c0ff33a.uk/",
  //"https://rpc.ecency.com/",
  'https://hived.emre.sh/',
  //"https://rpc.ausbit.dev/",
  'https://api.hive.blog/',
];
/* !!!!!!! -- THESE ARE COMMUNITY CONSTANTS -- !!!!!!!!!// */
//TOKEN CONFIGS -- ALL COMMUNITY RUNNERS NEED THESE SAME VALUES
const starting_block: number = 49988008; //from what block does your token start
const prefix: string = 'dlux_'; //Community token name for Custom Json IDs
const TOKEN: string = 'DLUX'; //Token name
const precision: number = 3; //precision of token
const tag: string = 'dlux'; //the fe.com/<tag>/@<leader>/<permlink>
const jsonTokenName: string = 'dlux'; //what customJSON in Escrows and sends is looking for
const leader: string = 'dlux-io'; //Default account to pull state from, will post token
const ben: string = 'dlux-io'; //Account where comment benifits trigger token action
const delegation: string = 'dlux-io'; //account people can delegate to for rewards
const delegationWeight: number = 1000; //when to trigger community rewards with bens
const msaccount: string = 'dlux-cc'; //account controlled by community leaders
const msPubMemo: string =
  'STM5GNM3jpjWh7Msts5Z37eM9UPfGwTMU7Ksats3RdKeRaP5SveR9'; //memo key for msaccount
const msPriMemo: string = '5KDZ9fzihXJbiLqUCMU2Z2xU8VKb9hCggyRPZP37aprD2kVKiuL';
const msmeta: string = '';
const mainAPI: string = 'token.dlux.io'; //leaders API probably
const mainRender: string = 'dluxdata.herokuapp.com'; //data and render server
const mainFE: string = 'dlux.io'; //frontend for content
const mainIPFS: string = 'a.ipfs.dlux.io'; //IPFS service
const mainICO: string = 'robotolux'; //Account collecting ICO HIVE
const footer: string = `\n[Find us on Discord](https://discord.gg/Beeb38j)`;
const hive_service_fee: number = 100; //HIVE service fee for transactions in Hive/HBD in centipercents (1% = 100)

const CONFIG = {
  username,
  active,
  follow,
  msowner,
  mspublic,
  memoKey,
  hookurl,
  NODEDOMAIN,
  acm,
  mirror,
  port,
  pintoken,
  pinurl,
  status,
  dbcs,
  history,
  stream,
  mode,
  override,
  engineCrank,
  rta,
  rtp,
  ipfshost,
  ipfsport,
  ipfsprotocol,
  ipfsLinks,
  startURL,
  clientURL,
  clients,
  starting_block,
  prefix,
  TOKEN,
  precision,
  tag,
  jsonTokenName,
  leader,
  ben,
  delegation,
  delegationWeight,
  msaccount,
  msPubMemo,
  msPriMemo,
  msmeta,
  mainAPI,
  mainRender,
  mainFE,
  mainIPFS,
  mainICO,
  footer,
  hive_service_fee,
};

export { VERSION, CONFIG };
