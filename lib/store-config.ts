export const STORE = {
  legalName: 'Beata Majorowska',
  tradingName: 'Beata Shop',
  email: 'beata-shop.co@gmail.com',
  phoneDisplay: '+44 7385 305287',
  phoneHref: '+447385305287',
  supportHours: 'Monday-Saturday, 9am-5pm (UK time)',
  businessAddress: '8 Gordon Road, London, N9 0LU',
  returnsAddress: '8 Gordon Road, London, N9 0LU',
  shippingPence: 300,
  freeShippingThresholdPence: 6000,
  customPrintFeesPence: {
    logo: 200,
    a4: 400,
    a3: 600,
    mug: 200,
  },
} as const;

export const ADDRESS_REQUIRED = 'To be added before launch';
