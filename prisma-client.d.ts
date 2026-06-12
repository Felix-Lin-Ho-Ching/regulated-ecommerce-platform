declare module "@prisma/client" {
  export class PrismaClient {
    constructor(options?: { log?: string[] });
    [model: string]: any;
    $transaction<T>(promises: Promise<T>[]): Promise<T[]>;
    $disconnect(): Promise<void>;
  }
}
