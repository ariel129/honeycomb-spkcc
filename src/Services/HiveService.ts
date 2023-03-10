import fetch from 'node-fetch';
import { CONFIG } from '@config';
import { RAM, TXIDUtils } from '@src/utils';

const HiveService = () => {
  const fetchHive = async () => {
    if (RAM.lastUpdate < Date.now() - 59000) {
      const response = await fetch(CONFIG.clientURL, {
        method: 'POST',
        body: `{"jsonrpc":"2.0", "method":"database_api.get_dynamic_global_properties", "id":1}`,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      const data = await response.json();

      if (response.status === 200) {
        RAM.lastUpdate = Date.now();
        RAM.hiveDyn = data.result;
        RAM.head = data.result.head_block_number;
        RAM.behind =
          data.result.head_block_number - (TXIDUtils.getBlockNum() || 0);

        if (RAM.behind > 100 && TXIDUtils.streaming) {
          // exit();
        }
        setTimeout(function () {
          fetchHive();
        }, 60000);
      }
    }
  };

  return {
    fetchHive,
  };
};

export default HiveService;
