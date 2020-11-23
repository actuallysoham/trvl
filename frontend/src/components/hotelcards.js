// This is the "view all products" Products Component for the Shop Page - "ProductsComp" (blueprint code to dynamically serve product data)

import React from "react";
import "../App.css";
import "../styles/HotelCard.css";
import { Link } from "react-router-dom";

const HotelCardComp = ({ hotels }) => {
    return (
      <div className="hotelcard-container">
          {hotels.map((hotel) => (
            <li className="hotelcard-items" key={hotel._id}>
              <div className="hotelcard">
              <Link to={"/hotel/" + hotel._id}>

                  <img
                      className="hotelcard-image"
                      src={hotel.imageurl}
                      alt="hotel"
                    />

                <div className="hotelcard-box">
                    <div className="hotelcard-name">
                    <b>{hotel.name}</b>
                    </div>
                    <div className="hotelcard-location">
                    {hotel.location}
                    </div>
                    <div className="hotelcard-price">${hotel.price}</div>
                </div>
                                  
              </Link>
              </div>
            </li>
          ))}
      </div>
    );
  };

export default HotelCardComp;