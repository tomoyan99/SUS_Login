type MainData = {
    user: {
        username: string,
        password: string
    },
    soraLink: SolaLinkData,
    last_upd: LastUpdateData,
}
type SolaLinkData = {

}
type LastUpdateData = {
    year: number,
    month: number,
    date: number,
    value: number,
    nowterm: "bf"|"af"
}

