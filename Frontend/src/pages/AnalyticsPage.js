import React from "react";
import PeopleCount from "../components/PeopleCount";
import GridCrowd from "../components/GridCrowd";
import FrameGraph from "../components/FrameGraph";
import Heatmap from "../components/Heatmap";

function AnalyticsPage() {
  return (
    <div className="grid grid-cols-2 gap-6">
      <PeopleCount />
      <GridCrowd />
      <FrameGraph />
      <Heatmap />
    </div>
  );
}

export default AnalyticsPage;
