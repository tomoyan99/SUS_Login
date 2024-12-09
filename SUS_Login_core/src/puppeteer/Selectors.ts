type SelectorsSCLASS = {
  logout_btn: string;
  username_input: string;
  password_input: string;
  login_btn: string;
};

type SelectorsSOLA = {
  username_input: string;
  password_input: string;
  submit_btn: string;
};

type SelectorsEUC = {
  risyuu_div: string;
  EUC_link: string;
  EUC_input: string;
  EUC_submit_btn: string;
  result_text_span: string;
  result_class_span: string;
  shot_target_table: string;
};

type SelectorsSCHEDULE = {
  SCLASS: {
    risyuu_div: string;
    schedule_link: string;
    viewstyle_select: string;
    term_select: string;
    search_input: string;
    schedule_bf_table: string;
    schedule_af_table: string;
  };
};


class Selectors{
  public readonly SCLASS: SelectorsSCLASS = {
    logout_btn: "#form1\\:logout",
    username_input: "#form1\\:htmlUserId",
    password_input: "#form1\\:htmlPassword",
    login_btn: "#form1\\:login"
  };

  public readonly SOLA: SelectorsSOLA = {
    username_input: "#identifier",
    password_input: "#password",
    submit_btn: "#login button[type=submit]"
  };

  public readonly EUC: SelectorsEUC = {
    risyuu_div: "div::-p-text(履修関連)",
    EUC_link: "div::-p-text(EUC学生出欠登録)",
    EUC_input: "input.inputText",
    EUC_submit_btn: "input.button",
    result_text_span: "span#form1\\:htmlTorokuKekka",
    result_class_span: "span#form1\\:Title",
    shot_target_table: "table.sennasi"
  };

  public readonly SCHEDULE: SelectorsSCHEDULE = {
    SCLASS: {
      risyuu_div: "div::-p-text(履修関連)",
      schedule_link: "div#pmenu4 a::-p-text(学生時間割表)",
      viewstyle_select: "select#form1\\:HyojiKeishiki",
      term_select: "select#form1\\:htmlGakki",
      search_input: "input#form1\\:search",
      schedule_bf_table: "table#form1\\:standardJugyoTimeSchedule00List",
      schedule_af_table: "table#form1\\:standardJugyoTimeSchedule01List"
    }
  };
}
export default Selectors;