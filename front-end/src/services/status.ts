import axios from 'axios';

import config from '../config';

export type PrinterStatus = {
  updatedAt: number;
  printer: boolean;
  paper: boolean;
};

const { STATUS_HOST } = config;

export async function getStatus(): Promise<PrinterStatus> {
  const { data } = await axios.get(`${STATUS_HOST}`);
  return data;
}
