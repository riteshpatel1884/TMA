// "use client";

// import {useApplications} from "../../context/ApplicationsContext"
// import Analytics from "../../Components/AnalyticsTab";

// export default function AnalyticsPage() {
//   const { applications } = useApplications();

//   return (
//     <>
//       <div className="topbar">
//         <div>
//           <h1 className="page-title">Analytics</h1>
//           <p className="page-subtitle">
//             {applications.length} total application
//             {applications.length !== 1 ? "s" : ""} tracked
//           </p>
//         </div>
//       </div>
//       <Analytics applications={applications} />
//     </>
//   );
// }



"use client";

import { useApplications } from "../../context/ApplicationsContext";
import Analytics from "../../Components/AnalyticsTab";
import { AnalyticsSkeleton } from "./Analyticsskeleton";

export default function AnalyticsPage() {
  const { applications, loading } = useApplications();

  return (
    <>
      <div className="topbar">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            {applications.length} total application
            {applications.length !== 1 ? "s" : ""} tracked
          </p>
        </div>
      </div>
      {loading ? <AnalyticsSkeleton /> : <Analytics applications={applications} />}
    </>
  );
}