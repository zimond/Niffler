extern crate mime;
extern crate futures;
extern crate hyper;
extern crate gotham;

use hyper::{Response, StatusCode};

use gotham::http::response::create_response;
use gotham::state::State;

pub fn say_hello(state: State) -> (State, Response) {
    let res = create_response(
        &state,
        StatusCode::Ok,
        Some((String::from("Hello World!").into_bytes(), mime::TEXT_PLAIN)),
    );

    (state, res)
}

pub fn main() {
    let addr = "127.0.0.1:7878";
    println!("Listening for requests at http://{}", addr);
    gotham::start(addr, || Ok(say_hello))
}