/**
 * Define the informations of a system process
 */
export interface ProcessInfos {
    pid: number;
    ppid: number;
    bin: string;
    name: string;
    cmd: string;
  }