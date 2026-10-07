/* ============================================================
   Car2Buy — customer delivery gallery pool.
   Built from real customer lifestyle photos + the delivered-car
   images, tagged by brand so the gallery supports filter/search.
   Swap `PEOPLE` urls for the client's own customer photos.
   window.Car2Buy.CUSTOMER_GALLERY = [{img, brand, car, name, big}]
   ============================================================ */
(function () {
  window.Car2Buy = window.Car2Buy || {};

  // real Car2Buy customer delivery photos (client's own)
  var PEOPLE = [
    { img: 'images/customers/cust-01.webp', name: 'אלירן ואבי', car: 'Jaecoo 8', brand: "ג'אקו", big: true },
    { img: 'images/customers/cust-02.webp', name: 'משפחת דהן', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-03.webp', name: 'רוני מ׳', car: 'Hyundai Inster', brand: 'יונדאי' },
    { img: 'images/customers/cust-04.webp', name: 'סאמי ח׳', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-05.webp', name: 'משפחת לוי', car: 'Mitsubishi Outlander', brand: 'מיצובישי' },
    { img: 'images/customers/cust-06.webp', name: 'נועה ואיתי', car: 'Toyota bZ', brand: 'טויוטה' },
    { img: 'images/customers/cust-07.webp', name: 'דוד ואורן', car: 'Mazda 3', brand: 'מאזדה', big: true },
    { img: 'images/customers/cust-08.webp', name: 'משפחת ברק', car: 'Ford Kuga', brand: 'פורד' },
    { img: 'images/customers/cust-09.webp', name: 'לינא ומרים', car: 'BYD Atto 3', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-10.webp', name: 'משפחת כהן', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-11.webp', name: 'סועאד ורים', car: 'Cupra Formentor', brand: 'קופרה', big: true },
    { img: 'images/customers/cust-12.webp', name: 'שירן ל׳', car: 'Cupra Formentor', brand: 'קופרה' },
    { img: 'images/customers/cust-14.webp', name: 'פאטמה ונור', car: 'MG 4', brand: 'MG' },
    { img: 'images/customers/cust-15.webp', name: 'יוסי ורן', car: 'BMW X1', brand: 'ב.מ.וו' },
    { img: 'images/customers/cust-16.webp', name: 'עומר וניר', car: 'Mazda CX-30', brand: 'מאזדה' },
    { img: 'images/customers/cust-17.webp', name: 'משפחת אזולאי', car: 'BYD Atto 3', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-18.webp', name: 'רונית ולאה', car: 'Audi Q3', brand: 'אאודי', big: true },
    { img: 'images/customers/cust-19.webp', name: 'איתי וסאמי', car: 'Chery Tiggo 7', brand: "צ'רי" },
    { img: 'images/customers/cust-20.webp', name: 'משפחת נחום', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-21.webp', name: 'מוחמד ע׳', car: 'Toyota C-HR', brand: 'טויוטה' },
    { img: 'images/customers/cust-22.webp', name: 'עידו ורועי', car: 'Mercedes CLA', brand: 'מרצדס', big: true },
    { img: 'images/customers/cust-23.webp', name: 'שירה ואב', car: 'Toyota Corolla Cross', brand: 'טויוטה' },
    { img: 'images/customers/cust-24.webp', name: 'שלוש נשים', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-25.webp', name: 'אבי ויוסי', car: 'GMC Hummer EV', brand: 'GMC' },
    { img: 'images/customers/cust-26.webp', name: 'רן א׳', car: 'BMW iX3', brand: 'ב.מ.וו' },
    { img: 'images/customers/cust-27.webp', name: 'אב ובן', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-28.webp', name: 'זוג מאושר', car: 'Jaecoo 8', brand: "ג'אקו", big: true },
    { img: 'images/customers/cust-29.webp', name: 'רם ואורי', car: 'BYD Atto 2', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-30.webp', name: 'דני וגיא', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-31.webp', name: 'עומר ד׳', car: 'GMC Hummer EV', brand: 'GMC' },
    { img: 'images/customers/cust-32.webp', name: 'אברהם כ׳', car: 'Toyota bZ4X', brand: 'טויוטה' },
    { img: 'images/customers/cust-33.webp', name: 'שני ויוסי', car: 'Tesla Model 3', brand: 'טסלה' },
    { img: 'images/customers/cust-34.webp', name: 'משפחת פרץ', car: 'Jaecoo 8', brand: "ג'אקו", big: true },
    { img: 'images/customers/cust-35.webp', name: 'רונן ואורלי', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-36.webp', name: 'סאמי ופאטמה', car: 'Tesla Model Y', brand: 'טסלה' },
    { img: 'images/customers/cust-37.webp', name: 'אום ח׳', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-38.webp', name: 'ליאור וגיא', car: 'BMW X1', brand: 'ב.מ.וו' },
    { img: 'images/customers/cust-39.webp', name: 'עומר מ׳', car: 'Hyundai Sonata', brand: 'יונדאי' },
    { img: 'images/customers/cust-40.webp', name: 'אחים חדד', car: 'Mercedes CLA', brand: 'מרצדס', big: true },
    { img: 'images/customers/cust-41.webp', name: 'רונית ואב', car: 'Tesla Model 3', brand: 'טסלה' },
    { img: 'images/customers/cust-42.webp', name: 'בני הזוג כהן', car: 'Hyundai Kona', brand: 'יונדאי' },
    { img: 'images/customers/cust-43.webp', name: 'משפחת אלון', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-44.webp', name: 'איתי וסהר', car: 'Toyota Land Cruiser', brand: 'טויוטה' },
    { img: 'images/customers/cust-45.webp', name: 'לינה ד׳', car: 'Audi Q3', brand: 'אאודי' },
    { img: 'images/customers/cust-46.webp', name: 'רם ואב', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-47.webp', name: 'משפחת עמר', car: 'Kia Sportage', brand: 'קיה' },
    { img: 'images/customers/cust-48.webp', name: 'נועה ורוני', car: 'Chery Tiggo 7', brand: "צ'רי", big: true },
    { img: 'images/customers/cust-49.webp', name: 'מוסא ואב', car: 'Hyundai Sonata', brand: 'יונדאי' },
    { img: 'images/customers/cust-50.webp', name: 'עמאד וסאמי', car: 'Toyota Corolla Cross', brand: 'טויוטה' },
    { img: 'images/customers/cust-51.webp', name: 'ראמי ע׳', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-52.webp', name: 'משפחת סעיד', car: 'Chery Tiggo 8 Pro', brand: "צ'רי", big: true },
    { img: 'images/customers/cust-53.webp', name: 'אבו ח׳', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-54.webp', name: 'מוחמד ע׳', car: 'Skoda Superb', brand: 'סקודה' },
    { img: 'images/customers/cust-55.webp', name: 'עומר ד׳', car: 'GMC Hummer EV', brand: 'GMC', big: true },
    { img: 'images/customers/cust-56.webp', name: 'אחים סאלח', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-57.webp', name: 'ראמי ואם', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-58.webp', name: 'שתי אחיות', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-59.webp', name: 'דנה ואב', car: 'Hyundai Inster', brand: 'יונדאי' },
    { img: 'images/customers/cust-60.webp', name: 'סאמי ואשה', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-61.webp', name: 'לינא ואולגה', car: 'MG 4', brand: 'MG', big: true },
    { img: 'images/customers/cust-62.webp', name: 'אושר ואב', car: 'Mitsubishi Triton', brand: 'מיצובישי' },
    { img: 'images/customers/cust-63.webp', name: 'אם ובת', car: 'MG HS', brand: 'MG' },
    { img: 'images/customers/cust-64.webp', name: 'משפחת אבו', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-65.webp', name: 'ראובן ואשה', car: 'Toyota RAV4', brand: 'טויוטה' },
    { img: 'images/customers/cust-66.webp', name: 'רים ונור', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-67.webp', name: 'משפחת סאלם', car: 'BYD Atto 2', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-68.webp', name: 'עלי ובנות', car: 'BYD Han', brand: 'ב.י.ד', big: true },
    { img: 'images/customers/cust-69.webp', name: 'משפחת חדד', car: 'Mercedes CLA', brand: 'מרצדס' },
    { img: 'images/customers/cust-70.webp', name: 'סאמי ב׳', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-71.webp', name: 'אבי ויוסי', car: 'Toyota bZ', brand: 'טויוטה' },
    { img: 'images/customers/cust-72.webp', name: 'זוג מאושר', car: 'Tesla Model 3', brand: 'טסלה' },
    { img: 'images/customers/cust-73.webp', name: 'סועאד ואב', car: 'Tesla Model Y', brand: 'טסלה' },
    { img: 'images/customers/cust-74.webp', name: 'אב ובן', car: 'BYD Sealion 7', brand: 'ב.י.ד', big: true },
    { img: 'images/customers/cust-75.webp', name: 'שלושה חברים', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-76.webp', name: 'זוג מאושר', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-77.webp', name: 'אחים לוי', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-78.webp', name: 'רים ובנה', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-79.webp', name: 'אום ס׳', car: 'Hyundai Sonata', brand: 'יונדאי' },
    { img: 'images/customers/cust-80.webp', name: 'סאמי ואשה', car: 'Toyota Camry', brand: 'טויוטה', big: true },
    { img: 'images/customers/cust-81.webp', name: 'אב ובן', car: 'Toyota Hilux', brand: 'טויוטה' },
    { img: 'images/customers/cust-82.webp', name: 'אחים כהן', car: 'Hyundai Elantra', brand: 'יונדאי' },
    { img: 'images/customers/cust-83.webp', name: 'ראמי ט׳', car: 'Toyota RAV4', brand: 'טויוטה' },
    { img: 'images/customers/cust-84.webp', name: 'זוג צעיר', car: 'Toyota RAV4', brand: 'טויוטה' },
    { img: 'images/customers/cust-85.webp', name: 'עומר ד׳', car: 'MG HS', brand: 'MG' },
    { img: 'images/customers/cust-86.webp', name: 'אחים ע׳', car: 'Skoda Octavia', brand: 'סקודה' },
    { img: 'images/customers/cust-87.webp', name: 'ראמי ואב', car: 'Jeep Wrangler', brand: 'ג׳יפ', big: true },
    { img: 'images/customers/cust-88.webp', name: 'אם ובת', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-89.webp', name: 'שירן ובנה', car: 'Jaecoo 8', brand: "ג'אקו" }
  ];

  var firstNames = ['יוסי', 'מיכל', 'דניאל', 'שירה', 'אבי', 'נטע', 'עידן', 'רותם', 'גיא', 'ליאת', 'אסף', 'הדר', 'תומר', 'מאיה', 'איתי', 'נועה', 'רון', 'יעל', 'עומר', 'שני', 'אורן', 'דנה', 'ניר', 'גל', 'אלון', 'טל', 'עדי', 'בר', 'יובל', 'ספיר'];
  var lastInit = ['כ׳', 'ל׳', 'מ׳', 'ב׳', 'ש׳', 'א׳', 'ד׳', 'ר׳', 'ח׳', 'פ׳', 'ג׳', 'ס׳', 'נ׳', 'ע׳', 'ז׳'];

  function build() {
    var out = PEOPLE.map(function (p, i) { return { img: p.img, brand: p.brand, car: p.car, name: p.name, person: true, big: i % 5 === 0 }; });
    var cars = window.Car2Buy.LOAN_CARS || [];
    cars.forEach(function (c, i) {
      if (!c.img) return;
      out.push({
        img: c.img,
        brand: c.brand,
        car: c.brand + ' ' + c.name,
        name: firstNames[(i * 7) % firstNames.length] + ' ' + lastInit[(i * 3) % lastInit.length],
        big: i % 6 === 2
      });
    });
    return out;
  }

  // defer until LOAN_CARS is present
  window.Car2Buy.buildCustomerGallery = build;
  window.Car2Buy.CUSTOMER_GALLERY = build();
  window.Car2Buy.CUSTOMER_PEOPLE = PEOPLE;
  // override the stock CUSTOMERS pool so every carousel/mosaic shows the real photos first
  window.Car2Buy.CUSTOMERS = PEOPLE.map(function (p) { return { img: p.img, name: p.name, car: p.car, brand: p.brand }; });
})();
