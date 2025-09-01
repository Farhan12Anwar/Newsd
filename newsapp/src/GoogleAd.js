import { useEffect } from "react";

function GoogleAd() {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdBlockers may block, ignore errors
    }
  }, []);

  return (
    <ins className="adsbygoogle"
         style={{ display: "block" }}
         data-ad-client="ca-pub-3970618664002225"
         data-ad-slot="1624247201"
         data-ad-format="auto"
         data-full-width-responsive="true"></ins>
  );
}

export default GoogleAd;
