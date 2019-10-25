import { execSync } from 'child_process';

import { logger } from './logger';
import { isLinux } from './os';

export const getDockerHost = async (): Promise<string> => {
  if (isLinux()) {
    logger.info('looking up docker ip for linux');

    const result: string = execSync(
      "docker run alpine:latest /sbin/ifconfig eth0 | grep 'inet addr' | cut -d: -f2 | awk '{print $1}'"
    )
      .toString()
      .trim();

    return result.substring(0, result.lastIndexOf('.') + 1) + '1';
  } else {
    return 'host.docker.internal';
  }
};

export const getDockerContainerId = (imageName: string): string | undefined => {
  const command = `docker ps | grep ${imageName} | awk '{ print $1 }'`;

  logger.debug('checking for existing container id', {
    command,
  });

  const buffer = execSync(command).toString();

  const result = buffer.toString();

  if (result) {
    logger.debug('found container id', {
      id: result,
    });
    return result.trim();
  }
};
