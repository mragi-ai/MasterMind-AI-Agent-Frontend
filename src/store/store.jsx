import React, { createContext, useState } from "react";

export const GlobleStore = createContext();

export const GlobleStoreProvider = ({ children }) => {
  const [subscriptionPlan, setSubscriptionPlan] = useState(false);
  const handleSubscrription = (choice) => {
    setSubscriptionPlan(choice === "creator");
  };
  return (
    <GlobleStore.Provider value={{ subscriptionPlan, handleSubscrription }}>
      {children}
    </GlobleStore.Provider>
  );
};
