import axios from 'axios';

import config from '../config';

export type Image = {
  id: string;
  name: string;
  text?: string;
  base64: string;
  camera64: string;
};

type PaginatedResults = {
  total: number;
  items: Image[];
  lastKey?: {
    id?: string;
    createdAt?: string;
  };
};

const { SERVICE_HOST, API_KEY } = config;

const headers = {
  'x-api-key': API_KEY
};

export async function list(queryParams: {
  limit: string;
  lastEvaluatedId?: string;
  lastEvaluatedCreatedAt?: string;
}): Promise<PaginatedResults> {
  const qs = new URLSearchParams(queryParams);
  const { data } = await axios.get(`${SERVICE_HOST}?${qs}`, { headers });
  return data;
}

export async function getItem(id: string): Promise<Image> {
  const { data } = await axios.get(`${SERVICE_HOST}/${id}`, { headers });
  return data;
}

export async function create({
  name,
  image,
  message
}: {
  name: string;
  message?: string;
  image: string;
}): Promise<Image> {
  const { data } = await axios.post(
    `${SERVICE_HOST}`,
    {
      name,
      image,
      message
    },
    { headers }
  );
  return data;
}
