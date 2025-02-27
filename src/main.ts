import { Controller, Get, Module } from '@nestjs/common';
import { MessagePattern, Transport } from '@nestjs/microservices';
import { NestFactory } from '@nestjs/core';
import { cpus } from 'os';
import cluster from 'cluster';

export interface ClusterizeOptions {
  numCPUs?: number;
  sleep?: number;
}

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export class ClusterizeService {
  static async clusterize(
    callback: () => Promise<unknown>,
    config?: ClusterizeOptions,
  ): Promise<void> {
    const numCPUs = config?.numCPUs
      ? Math.min(cpus().length, config.numCPUs)
      : cpus().length;

    if (cluster.isPrimary) {
      console.info(`Primary server started on PID ${process.pid}`);
      for (let i = 0; i < numCPUs; i++) {
        cluster.fork();

        if (config?.sleep) await sleep(config.sleep);
      }
      cluster.on('exit', async (worker, code, signal) => {
        console.info(`Worker with PID ${worker.process.pid} died. Restarting`, {
          reason: { code, signal },
        });
        if (config?.sleep) await sleep(config.sleep);

        cluster.fork();
      });
    } else {
      console.info(`Cluster server started on PID ${process.pid}`);
      callback();
    }
  }
}

@Controller()
export class AppController {
  constructor() {}

  @MessagePattern('hello')
  getHello(): string {
    return "hello world";
  }
}

@Module({
  imports: [],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}

async function bootstrap() {
  const port = process.env.PORT ?? 33334;
  const host = process.env.HOST ?? "0.0.0.0"

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: {
      port,
      host,
    },
  });
  await app.listen();
  console.info(`Microservice is listening on ${host}:${port}`);
}

ClusterizeService.clusterize(bootstrap, { numCPUs: 2, sleep: 1000 });
