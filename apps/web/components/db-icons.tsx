export const DBS = [
  {
    path: "postgres",
    name: "PostgreSQL",
    desc: "Connect to your PostgreSQL database",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g fill="none">
          <path
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
            d="M16.794 12C12.742 11.112 4 12.193 4 21.787V40h5.87v-6.219h16.768V40h5.87V28.895c.698-.592 1.9 4.128 4.191 5.33c1.353.71 2.516 1.172 3.773.889c2.723-.613 4.025-2.399 3.354-6.663c-1.258 1.48-5.03 3.092-5.45 0V15.569c-.419-2.666-2.85-7.907-9.223-7.552h-6.869C19.35 8 14.99 12.015 15.996 17.345c.312 1.655 1.504 4.96 5.707 5.33c1.677.149 4.45-.532 6.127-4.441"
          ></path>
          <circle cx="33" cy="19" r="2" fill="currentColor"></circle>
        </g>
      </svg>
    ),
  },
  {
    path: "mssql",
    name: "Microsoft SQL Server",
    desc: "Connect to your Microsoft SQL Server",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
      >
        <path
          fill="currentColor"
          d="M12 11q-3.75 0-6.375-1.175T3 7q0-1.65 2.625-2.825Q8.25 3 12 3t6.375 1.175Q21 5.35 21 7q0 1.65-2.625 2.825Q15.75 11 12 11Zm0 5q-3.75 0-6.375-1.175T3 12V9.5q0 1.1 1.025 1.863q1.025.762 2.45 1.237q1.425.475 2.963.687q1.537.213 2.562.213t2.562-.213q1.538-.212 2.963-.687q1.425-.475 2.45-1.237Q21 10.6 21 9.5V12q0 1.65-2.625 2.825Q15.75 16 12 16Zm0 5q-3.75 0-6.375-1.175T3 17v-2.5q0 1.1 1.025 1.863q1.025.762 2.45 1.237q1.425.475 2.963.688q1.537.212 2.562.212t2.562-.212q1.538-.213 2.963-.688t2.45-1.237Q21 15.6 21 14.5V17q0 1.65-2.625 2.825Q15.75 21 12 21Z"
        ></path>
      </svg>
    ),
  },
  {
    path: "mysql",
    name: "MySQL",
    desc: "Connect to your MySQL database",
    icon: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 512 512"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="currentColor"
          d="M123.22 47.23c29.498 15.152 55.025 36.05 55.53 67.366c-93.62 83.867-83.862 179.356-97.002 270.34c-67.68 55.552-67.57 90.948-60.9 101.227c3.94.743 29.11-25.94 48.326-30.397c14.23-4.094 12.284-15.99 16.273-25.275c2.438 14.55 7.17 22.612 17.133 25.485c12.874 3.36 44.932 28.15 51.53 25.504c1.374-20.382-26.01-63.854-48.028-90.087c41.012-63.28 81.365-136.458 211.162-207.77c-3.21-3.706-6.216-6.45-8.8-7.986l9.198-15.472c11.617 6.907 20.522 19.56 29.248 35.033c5.94 10.532 11.528 22.644 16.96 35.117c15.682-32.87 22.983-66.406 16.402-90.254l17.35-4.786a87 87 0 0 1 1.927 8.83c33.29-4.253 55.718-13.083 85.11-29.322c3.744-2.068 19.054-13.012-.117-16.03c12.62-9.017 7.54-12.063 1.973-15.152c-6.486-3.6-20.302-8.948-35.758-8.556c-12.124-27.863-39.63-47.772-82.225-47.696c-28.532.052-63.842 9.086-105.828 30.688C217.895 27.64 164.92 20.468 123.22 47.23m286.942 28.74a9 9 0 1 1 0 18a9 9 0 0 1 0-18"
        ></path>
      </svg>
    ),
  },
];

export const dbTypeToIcon = (type: string) => {
  const db = DBS.find((db) => db.path === type);
  return db?.icon;
};
