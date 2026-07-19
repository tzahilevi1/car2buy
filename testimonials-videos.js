/* ============================================================
   Car2Buy — real customer video testimonials.
   Overrides window.Car2Buy.TESTIMONIALS (used by the video
   testimonials carousel in app.js). Each item may carry:
     video  — mp4 under /videos (required for a video slide)
     name   — customer display name (optional)
     car    — model they took (optional)
     quote  — short caption (optional; falls back to a generic line)
   Loaded AFTER models-data.js / customers-data.js and BEFORE app.js.
   ============================================================ */
(function () {
  if (!window.Car2Buy) return;
  var V = 'videos/';
  window.Car2Buy.TESTIMONIALS = [
    { video: V + 'testimonial-01.mp4', name: 'משפחת אזולאי', car: 'Chery Tiggo 8 Pro' },
    { video: V + 'testimonial-02.mp4', name: 'יוסי כהן', car: 'BYD Atto 3' },
    { video: V + 'testimonial-03.mp4', name: 'רונית לוי', car: 'Hyundai Tucson' },
    { video: V + 'testimonial-04.mp4', name: 'דניאל ואפרת', car: 'Jaecoo 8' },
    { video: V + 'testimonial-05.mp4', name: 'מוחמד נטור', car: 'BMW X3' },
    { video: V + 'testimonial-06.mp4', name: 'אבי מזרחי', car: 'Kia Sportage' },
    { video: V + 'testimonial-07.mp4', name: 'משפחת פרץ', car: 'Toyota Corolla Cross' },
    { video: V + 'testimonial-08.mp4', name: 'נועה שרון', car: 'MG HS' },
    { video: V + 'testimonial-09.mp4', name: 'איתי ברק', car: 'Cupra Formentor' },
    { video: V + 'testimonial-10.mp4', name: 'משפחת דואק', car: 'BYD Seal' },
    { video: V + 'testimonial-11.mp4', name: 'שירן אלון', car: 'Mazda CX-5' }
  ];
})();
