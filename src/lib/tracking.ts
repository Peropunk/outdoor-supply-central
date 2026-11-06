/** USPS's public tracking page for a label's tracking number. */
export function uspsTrackingUrl(trackingNumber: string) {
  return `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(trackingNumber)}`;
}
