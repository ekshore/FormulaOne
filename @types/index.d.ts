interface Link {
  endpoint: string;
  label: string;
}

interface GrandPrixEvent {
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