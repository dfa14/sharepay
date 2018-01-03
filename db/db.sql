--
-- PostgreSQL database creation script
--

CREATE TABLE users (
    id uuid NOT NULL,
    email character varying(255),
    pseudo character varying(255),
    password character varying(255),
    tokenfacebook character varying(255)
);

ALTER TABLE ONLY users
    ADD CONSTRAINT "Users_pkey" PRIMARY KEY (id);


CREATE TABLE events (
    id uuid NOT NULL,
    label character varying(255),
    statut character varying(255),
    date date
);

ALTER TABLE ONLY events
    ADD CONSTRAINT "Events_pkey" PRIMARY KEY (id);


CREATE TABLE expenses (
    id uuid NOT NULL,
    label character varying(255),
    user_id uuid NOT NULL   REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    event_id uuid           REFERENCES events(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    amount integer
);

ALTER TABLE ONLY expenses
    ADD CONSTRAINT "Expenses_pkey" PRIMARY KEY (id);


CREATE TABLE event_participants (
    event_id uuid NOT NULL  REFERENCES events(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    user_id uuid  NOT NULL  REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT
);

ALTER TABLE event_participants
    ADD CONSTRAINT "Event_participants_key" UNIQUE (event_id, user_id);


CREATE TABLE expenses_beneficiaries (
    expense_id uuid NOT NULL  REFERENCES expenses(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    user_id uuid    NOT NULL  REFERENCES users(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    amount_charged integer,
    date date
);

ALTER TABLE expenses_beneficiaries
    ADD CONSTRAINT "Expenses_beneficiaries_key" UNIQUE (expense_id, user_id);
