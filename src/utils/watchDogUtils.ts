import { TXIDUtils } from '.';

export const WatchdogUtils = {
  current: 0,
  timeout: 180000, // 120 seconds to init with up to 288 blocks
  monitor: () => {
    if (!WatchdogUtils.current) console.log('Watchdog: Monitoring...');
    setTimeout(() => {
      if (WatchdogUtils.current == TXIDUtils.blocknumber) {
        console.log('Watchdog: TIMEOUT');
        require('process').exit(3);
      } else if (!WatchdogUtils.current) {
        WatchdogUtils.timeout = 30000;
        WatchdogUtils.current = TXIDUtils.blocknumber;
        WatchdogUtils.monitor();
      } else {
        WatchdogUtils.current = TXIDUtils.blocknumber;
        WatchdogUtils.monitor();
      }
    }, WatchdogUtils.timeout);
  },
};
