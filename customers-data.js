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
    { img: 'images/customers/cust-01.jpg', name: 'אלירן ואבי', car: 'Jaecoo 8', brand: "ג'אקו", big: true },
    { img: 'images/customers/cust-02.jpg', name: 'משפחת דהן', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-03.jpg', name: 'רוני מ׳', car: 'Hyundai Inster', brand: 'יונדאי' },
    { img: 'images/customers/cust-04.jpg', name: 'סאמי ח׳', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-05.jpg', name: 'משפחת לוי', car: 'Mitsubishi Outlander', brand: 'מיצובישי' },
    { img: 'images/customers/cust-06.jpg', name: 'נועה ואיתי', car: 'Toyota bZ', brand: 'טויוטה' },
    { img: 'images/customers/cust-07.jpg', name: 'דוד ואורן', car: 'Mazda 3', brand: 'מאזדה', big: true },
    { img: 'images/customers/cust-08.jpg', name: 'משפחת ברק', car: 'Ford Kuga', brand: 'פורד' },
    { img: 'images/customers/cust-09.jpg', name: 'לינא ומרים', car: 'BYD Atto 3', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-10.jpg', name: 'משפחת כהן', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-11.jpg', name: 'סועאד ורים', car: 'Cupra Formentor', brand: 'קופרה', big: true },
    { img: 'images/customers/cust-12.jpg', name: 'שירן ל׳', car: 'Cupra Formentor', brand: 'קופרה' },
    { img: 'images/customers/cust-14.jpg', name: 'פאטמה ונור', car: 'MG 4', brand: 'MG' },
    { img: 'images/customers/cust-15.jpg', name: 'יוסי ורן', car: 'BMW X1', brand: 'ב.מ.וו' },
    { img: 'images/customers/cust-16.jpg', name: 'עומר וניר', car: 'Mazda CX-30', brand: 'מאזדה' },
    { img: 'images/customers/cust-17.jpg', name: 'משפחת אזולאי', car: 'BYD Atto 3', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-18.jpg', name: 'רונית ולאה', car: 'Audi Q3', brand: 'אאודי', big: true },
    { img: 'images/customers/cust-19.jpg', name: 'איתי וסאמי', car: 'Chery Tiggo 7', brand: "צ'רי" },
    { img: 'images/customers/cust-20.jpg', name: 'משפחת נחום', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-21.jpg', name: 'מוחמד ע׳', car: 'Toyota C-HR', brand: 'טויוטה' },
    { img: 'images/customers/cust-22.jpg', name: 'עידו ורועי', car: 'Mercedes CLA', brand: 'מרצדס', big: true },
    { img: 'images/customers/cust-23.jpg', name: 'שירה ואב', car: 'Toyota Corolla Cross', brand: 'טויוטה' },
    { img: 'images/customers/cust-24.jpg', name: 'שלוש נשים', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-25.jpg', name: 'אבי ויוסי', car: 'GMC Hummer EV', brand: 'GMC' },
    { img: 'images/customers/cust-26.jpg', name: 'רן א׳', car: 'BMW iX3', brand: 'ב.מ.וו' },
    { img: 'images/customers/cust-27.jpg', name: 'אב ובן', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-28.jpg', name: 'זוג מאושר', car: 'Jaecoo 8', brand: "ג'אקו", big: true },
    { img: 'images/customers/cust-29.jpg', name: 'רם ואורי', car: 'BYD Atto 2', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-30.jpg', name: 'דני וגיא', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-31.jpg', name: 'עומר ד׳', car: 'GMC Hummer EV', brand: 'GMC' },
    { img: 'images/customers/cust-32.jpg', name: 'אברהם כ׳', car: 'Toyota bZ4X', brand: 'טויוטה' },
    { img: 'images/customers/cust-33.jpg', name: 'שני ויוסי', car: 'Tesla Model 3', brand: 'טסלה' },
    { img: 'images/customers/cust-34.jpg', name: 'משפחת פרץ', car: 'Jaecoo 8', brand: "ג'אקו", big: true },
    { img: 'images/customers/cust-35.jpg', name: 'רונן ואורלי', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-36.jpg', name: 'סאמי ופאטמה', car: 'Tesla Model Y', brand: 'טסלה' },
    { img: 'images/customers/cust-37.jpg', name: 'אום ח׳', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-38.jpg', name: 'ליאור וגיא', car: 'BMW X1', brand: 'ב.מ.וו' },
    { img: 'images/customers/cust-39.jpg', name: 'עומר מ׳', car: 'Hyundai Sonata', brand: 'יונדאי' },
    { img: 'images/customers/cust-40.jpg', name: 'אחים חדד', car: 'Mercedes CLA', brand: 'מרצדס', big: true },
    { img: 'images/customers/cust-41.jpg', name: 'רונית ואב', car: 'Tesla Model 3', brand: 'טסלה' },
    { img: 'images/customers/cust-42.jpg', name: 'בני הזוג כהן', car: 'Hyundai Kona', brand: 'יונדאי' },
    { img: 'images/customers/cust-43.jpg', name: 'משפחת אלון', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-44.jpg', name: 'איתי וסהר', car: 'Toyota Land Cruiser', brand: 'טויוטה' },
    { img: 'images/customers/cust-45.jpg', name: 'לינה ד׳', car: 'Audi Q3', brand: 'אאודי' },
    { img: 'images/customers/cust-46.jpg', name: 'רם ואב', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-47.jpg', name: 'משפחת עמר', car: 'Kia Sportage', brand: 'קיה' },
    { img: 'images/customers/cust-48.jpg', name: 'נועה ורוני', car: 'Chery Tiggo 7', brand: "צ'רי", big: true },
    { img: 'images/customers/cust-49.jpg', name: 'מוסא ואב', car: 'Hyundai Sonata', brand: 'יונדאי' },
    { img: 'images/customers/cust-50.jpg', name: 'עמאד וסאמי', car: 'Toyota Corolla Cross', brand: 'טויוטה' },
    { img: 'images/customers/cust-51.jpg', name: 'ראמי ע׳', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-52.jpg', name: 'משפחת סעיד', car: 'Chery Tiggo 8 Pro', brand: "צ'רי", big: true },
    { img: 'images/customers/cust-53.jpg', name: 'אבו ח׳', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-54.jpg', name: 'מוחמד ע׳', car: 'Skoda Superb', brand: 'סקודה' },
    { img: 'images/customers/cust-55.jpg', name: 'עומר ד׳', car: 'GMC Hummer EV', brand: 'GMC', big: true },
    { img: 'images/customers/cust-56.jpg', name: 'אחים סאלח', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-57.jpg', name: 'ראמי ואם', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-58.jpg', name: 'שתי אחיות', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-59.jpg', name: 'דנה ואב', car: 'Hyundai Inster', brand: 'יונדאי' },
    { img: 'images/customers/cust-60.jpg', name: 'סאמי ואשה', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-61.jpg', name: 'לינא ואולגה', car: 'MG 4', brand: 'MG', big: true },
    { img: 'images/customers/cust-62.jpg', name: 'אושר ואב', car: 'Mitsubishi Triton', brand: 'מיצובישי' },
    { img: 'images/customers/cust-63.jpg', name: 'אם ובת', car: 'MG HS', brand: 'MG' },
    { img: 'images/customers/cust-64.jpg', name: 'משפחת אבו', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-65.jpg', name: 'ראובן ואשה', car: 'Toyota RAV4', brand: 'טויוטה' },
    { img: 'images/customers/cust-66.jpg', name: 'רים ונור', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-67.jpg', name: 'משפחת סאלם', car: 'BYD Atto 2', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-68.jpg', name: 'עלי ובנות', car: 'BYD Han', brand: 'ב.י.ד', big: true },
    { img: 'images/customers/cust-69.jpg', name: 'משפחת חדד', car: 'Mercedes CLA', brand: 'מרצדס' },
    { img: 'images/customers/cust-70.jpg', name: 'סאמי ב׳', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-71.jpg', name: 'אבי ויוסי', car: 'Toyota bZ', brand: 'טויוטה' },
    { img: 'images/customers/cust-72.jpg', name: 'זוג מאושר', car: 'Tesla Model 3', brand: 'טסלה' },
    { img: 'images/customers/cust-73.jpg', name: 'סועאד ואב', car: 'Tesla Model Y', brand: 'טסלה' },
    { img: 'images/customers/cust-74.jpg', name: 'אב ובן', car: 'BYD Sealion 7', brand: 'ב.י.ד', big: true },
    { img: 'images/customers/cust-75.jpg', name: 'שלושה חברים', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-76.jpg', name: 'זוג מאושר', car: 'BYD Sealion 7', brand: 'ב.י.ד' },
    { img: 'images/customers/cust-77.jpg', name: 'אחים לוי', car: 'Mercedes EQC', brand: 'מרצדס' },
    { img: 'images/customers/cust-78.jpg', name: 'רים ובנה', car: 'Chery Tiggo 8 Pro', brand: "צ'רי" },
    { img: 'images/customers/cust-79.jpg', name: 'אום ס׳', car: 'Hyundai Sonata', brand: 'יונדאי' },
    { img: 'images/customers/cust-80.jpg', name: 'סאמי ואשה', car: 'Toyota Camry', brand: 'טויוטה', big: true },
    { img: 'images/customers/cust-81.jpg', name: 'אב ובן', car: 'Toyota Hilux', brand: 'טויוטה' },
    { img: 'images/customers/cust-82.jpg', name: 'אחים כהן', car: 'Hyundai Elantra', brand: 'יונדאי' },
    { img: 'images/customers/cust-83.jpg', name: 'ראמי ט׳', car: 'Toyota RAV4', brand: 'טויוטה' },
    { img: 'images/customers/cust-84.jpg', name: 'זוג צעיר', car: 'Toyota RAV4', brand: 'טויוטה' },
    { img: 'images/customers/cust-85.jpg', name: 'עומר ד׳', car: 'MG HS', brand: 'MG' },
    { img: 'images/customers/cust-86.jpg', name: 'אחים ע׳', car: 'Skoda Octavia', brand: 'סקודה' },
    { img: 'images/customers/cust-87.jpg', name: 'ראמי ואב', car: 'Jeep Wrangler', brand: 'ג׳יפ', big: true },
    { img: 'images/customers/cust-88.jpg', name: 'אם ובת', car: 'Jaecoo 8', brand: "ג'אקו" },
    { img: 'images/customers/cust-89.jpg', name: 'שירן ובנה', car: 'Jaecoo 8', brand: "ג'אקו" }
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
