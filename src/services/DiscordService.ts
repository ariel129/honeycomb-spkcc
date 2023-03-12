import fetch from 'node-fetch';
import { Webhook, MessageBuilder } from 'discord-webhook-node';
import { CONFIG } from '@config';
import { TXIDUtils } from '@src/utils';

const DiscordService = () => {
  const hook = new Webhook(CONFIG.hookurl);

  const getContentToDiscord = (author: any, permlink: any) => {
    let params = [author, permlink];
    let method = 'condenser_api.get_content';
    let body = {
      jsonrpc: '2.0',
      method,
      params,
      id: 1,
    };

    fetch(CONFIG.clientURL, {
      body: JSON.stringify(body),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      method: 'POST',
    })
      .then((j) => j.json())
      .then((result) => {
        const r = result.result;
        const embed = new MessageBuilder()
          .setTitle(`New ${CONFIG.TOKEN} content!`)
          .setAuthor(
            author,
            'https://cdn.discordapp.com/embed/avatars/0.png',
            `https://${CONFIG.mainFE}/@${author}`
          )
          .setUrl(
            `https://${CONFIG.mainFE}/${CONFIG.tag}/@${author}/${permlink}`
          )
          .addField(
            r.title,
            JSON.parse(r.json_metadata).description ||
              `View this on ${CONFIG.mainFE}`,
            true
          )
          .setColor('#00b0f4' as unknown as number)
          .setTimestamp();

        hook.send(embed).catch((e: any) => console.log(e));
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const getNFTtoDiscord = (script: any, uid: any, owner: any, set: any) => {
    const embed = new MessageBuilder()
      .setTitle(`New ${set} NFT minted!`)
      .setAuthor(
        owner,
        'https://cdn.discordapp.com/embed/avatars/0.png',
        `https://${CONFIG.mainFE}/@${owner}`
      )
      .setUrl(`https://${CONFIG.mainFE}/@${owner}#inventory/`)
      .addField(`${set}:${uid}`, `View this on ${CONFIG.mainFE}`, true)
      .setColor('#00b0f4' as unknown as number)
      .setImage(`https://${CONFIG.mainRender}/render/${script}/${uid}`)
      .setTimestamp();

    hook.send(embed).catch((e) => console.log(e));
  };

  const postToDiscord = (msg: string, id: any) => {
    if (CONFIG.hookurl) hook.send(msg);
    if (CONFIG.status) TXIDUtils.store(msg, id);
  };

  return { getContentToDiscord, getNFTtoDiscord, postToDiscord };
};

export default DiscordService;
