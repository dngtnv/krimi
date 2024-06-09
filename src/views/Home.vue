<template>
  <v-container style="height:100%">
    <v-row style="height:100%" align="center">
      <v-col class="offset-xl-4" cols="12" lg="6" xl="4">
        <img src="~@/assets/logo.svg" max-width="136" class="mb-4" contain />
        <h2 class="display-2">
          {{ t("A game of") }}
          <vue-typer
            :text="[t('deception'), t('deduction')]"
            erase-style="backspace"
            :type-delay="120"
          />
        </h2>
        <p class="credits">
          {{ t("A web-version of Tobey Ho's") }}
          <strong>Deception: Murder in Hong Kong</strong>.
        </p>
        <p class="subtitle-1 mt-4 mb-10">
          {{
            t(
              "In the game, players take on the roles of investigators attempting to solve a murder case – but there's a twist. The killer is one of the investigators! Find out who among you can cut through deception to find the truth and who is capable of getting away with murder!"
            )
          }}
        </p>
        <div class="d-lg-flex">
          <v-btn
            class="mr-4 mb-4 mb-lg-0"
            type="submit"
            color="grey lighten-5"
            x-large
            to="/join"
            >{{ t("Join game") }}</v-btn
          >
          <v-btn
            class="mr-4 mb-4 mb-lg-0"
            @click.prevent="createNewGame"
            type="submit"
            x-large
            color="accent"
            >{{ t("Create new game") }}</v-btn
          >
        </div>
        <div class="d-lg-flex mt-4">
          <v-btn
            text
            class="mr-4 mb-4 mb-lg-0"
            href="https://medium.com/@raphaelaleixo/krimi-how-to-play-87839028f5ef"
            type="submit"
            target="_blank"
            color="accent"
            >{{ t("How to play") }}</v-btn
          >
          <v-btn
            text
            class="mr-4 mb-4 mb-lg-0"
            href="https://github.com/raphaelaleixo/krimi"
            type="submit"
            target="_blank"
            color="accent"
            >{{ t("About this project") }}</v-btn
          >
          <v-btn
            text
            class="mr-4 mb-4 mb-lg-0"
            @click.prevent="changeLocale"
            type="submit"
            color="accent"
            >{{ t("Vietnamese - by Dũ trụ") }}</v-btn
          >
        </div>
        <img
          src="~@/assets/ludoratory.svg"
          max-width="136"
          class="mt-10"
          contain
        />
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { VueTyper } from "vue-typer";
export default {
  name: "Home",
  components: { VueTyper },
  methods: {
    async createNewGame() {
      const game = await this.$store.dispatch(
        "createGame",
        this.$translate.lang
      );
      this.$router.push("/game/" + game.gameId);
    },
    changeLocale() {
      if (this.$translate.lang !== "vn") {
        this.$translate.setLang("vn");
      } else this.$translate.setLang("en");
    }
  },
  locales: {
    vn: {
      "A game of": "Một tựa game về",
      deduction: "suy luận",
      deception: "sự dối trá",
      "In the game, players take on the roles of investigators attempting to solve a murder case – but there's a twist. The killer is one of the investigators! Find out who among you can cut through deception to find the truth and who is capable of getting away with murder!":
        "Trong trò chơi này, người chơi đảm nhận vai trò điều tra viên đang cố gắng giải quyết một vụ giết người - nhưng có một lót tích. Kẻ giết người là một trong những thám tử! Tìm ra ai trong số mấy người có thể vượt qua sự dối trá để tìm ra sự thật và ai có khả năng thoát khỏi tội giết người!",
      "About this project": "Về dự án này",
      "How to play": "Cách chơi",
      "Join game": "Vào phòng",
      "Create new game": "Tạo phòng mới",
      "Vietnamese - by Dũ trụ": "English version",
      "A web-version of Tobey Ho's": "Một phiên bản web của Tobey Ho"
    }
  }
};
</script>

<style lang="scss">
.vue-typer .custom.char.typed {
  color: #3da9fc;
}
.vue-typer .custom.caret {
  background-color: #094067;
}
.credits {
  margin: 0.5em 0;
  font-size: 1.5em;
}
.vue-typer {
  display: block;
}
</style>
