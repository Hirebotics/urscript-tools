import childProcess from 'child_process';

import { logger } from './logger';
import { isLinux } from './os';

export const getDockerHost = (): string => {
  // TODO improve this logic, but as of now Linux
  // is the only platform that doesn't provide
  // host.docker.internal
  if (isLinux()) {
    return '172.17.0.1';
  } else {
    return 'host.docker.internal';
  }
};

export const getDockerContainerId = (imageName: string): string | undefined => {
  const command = `docker ps | grep ${imageName} | awk '{ print $1 }'`;

  logger.debug('checking for existing container id', {
    command,
  });

  const buffer = childProcess.execSync(command).toString();

  const result = buffer.toString();

  if (result) {
    logger.debug('found container id', {
      id: result,
    });
    return result.trim();
  }
};
