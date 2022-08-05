interface Link {
  endpoint: string;
  label: string;
}

interface GrandPrixLink {
  name: string;
  year: string;
  dataEndpoint: string;
}

interface SessionEvent {
  name: string;
  year: string;
  grandPrix: string;
  dataEndpoint: string;
}