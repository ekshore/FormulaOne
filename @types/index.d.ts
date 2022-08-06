type Link = {
  endpoint: string;
  label: string;
}

type GrandPrixLink = {
  name: string;
  year: string;
  dataEndpoint: string;
}

type SessionEvent = {
  name: string;
  year: string;
  grandPrix: string;
  dataEndpoint: string;
}