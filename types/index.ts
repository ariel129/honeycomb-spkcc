export type BlockArgs = {
  ops: string[];
  root: string;
  prev_root: string;
  chain: string[];
};

export type RamArgs = {
  lastUpdate: number;
  Hive: string;
  behind: number;
  head: number;
  hiveDyn: object;
};

export type PlasmaArgs = {
  consensus: string;
  pending: object;
  page: any;
  hashLastIBlock: number;
  hashSecIBlock: number;
  hashBlock: any;
}; 

export type StartingBlockArgs = {
  startingBlock: number;
}
